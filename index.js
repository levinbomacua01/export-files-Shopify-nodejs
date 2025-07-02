const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const GRAPHQL_URL = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.API_VERSION}/graphql.json`;

const TEMP_DIR = './downloads';
const ZIP_DIR = './zipped_files';
const ZIP_FILE = path.join(ZIP_DIR, 'files.zip');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
if (!fs.existsSync(ZIP_DIR)) fs.mkdirSync(ZIP_DIR);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const downloadFile = async (url, outputPath, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { responseType: 'stream', timeout: 10000 });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return true; // ✅ success
    } catch (err) {
      const errorMsg = err.response?.status
        ? `HTTP ${err.response.status}`
        : err.code || err.message;

      if (attempt === retries) {
        console.error(`❌ Failed to download: ${url}`);
        console.error(`   Reason: ${errorMsg}`);

        // 🔸 Optionally log to failed_downloads.txt
        fs.appendFileSync('failed_downloads.txt', `${url} | ${errorMsg}\n`);
      } else {
        console.warn(`⏳ Retry ${attempt}/${retries} for ${url} (${errorMsg})`);
        await sleep(1000);
      }
    }
  }
};

const fetchAndSaveFiles = async () => {

    let hasNextPage = true;
    let after = null;
    let page = 1;

    while (hasNextPage) {

        console.log(`📄 Fetching page ${page}...`);

        const query = `
        {
            files(first: 50${after ? `, after: "${after}"` : ''}) {
            pageInfo {
                hasNextPage
            }
            edges {
            cursor
            node {
                __typename
                id
                alt
                createdAt
                fileStatus
                ... on GenericFile {
                url
                mimeType
                }
                ... on MediaImage {
                image {
                    originalSrc
                }
                }
            }
            }
        }
        }`;

        try {

            const response = await axios.post(GRAPHQL_URL, { query }, {
                headers: {
                'X-Shopify-Access-Token': process.env.ACCESS_TOKEN,
                'Content-Type': 'application/json',
                },
            });

            const files = response.data.data.files.edges;

            const pageDir = path.join(TEMP_DIR, `page_${page}`);

            fs.mkdirSync(pageDir, { recursive: true });

            for (const { node } of files) {
            const fileUrl =
                node.__typename === 'GenericFile' ? node.url :
                node.__typename === 'MediaImage' ? node.image?.originalSrc : null;

            if (!fileUrl) {
                console.warn(`⚠️ No valid URL for file ID: ${node.id}`);
                continue;
            }

            // ✅ Step 1: Try extracting filename from the URL
            let fileName;
            try {
                const urlPath = new URL(fileUrl).pathname;
                fileName = path.basename(urlPath).split('?')[0]; // removes query string
            } catch {
                fileName = null;
            }

            // ✅ Step 2: Fallback to originalFile.fileName if CDN name is missing
            if (!fileName) {
                fileName = node.originalFile?.fileName || null;
            }

            // ✅ Step 3: Final fallback to alt or ID + extension
            if (!fileName) {
                const base = node.alt?.replace(/[^a-zA-Z0-9_\-\.]/g, '_') || node.id;
                const ext = node.mimeType?.split('/')[1] || 'jpg';
                fileName = `${base}.${ext}`;
            }

            // ✅ Step 4: Ensure there's a file extension
            if (!path.extname(fileName)) {
                const fallbackExt = node.mimeType?.split('/')[1] || 'jpg';
                fileName += `.${fallbackExt}`;
            }

            const outputPath = path.join(pageDir, fileName);
            await downloadFile(fileUrl, outputPath);
            console.log(`✅ Downloaded: ${path.relative('.', outputPath)}`);
            }
            
            hasNextPage = response.data.data.files.pageInfo.hasNextPage;
            after = files.length > 0 ? files[files.length - 1].cursor : null;
            page++;

        } catch (err) {
            console.error('❌ GraphQL error:', err.response?.data || err.message);
            break;
        }
    }

};

const zipAllFiles = () => {
  console.log('📦 Zipping all downloaded files...');
  const zip = new AdmZip();
  zip.addLocalFolder(TEMP_DIR);
  zip.writeZip(ZIP_FILE);
  console.log(`✅ Created zip: ${ZIP_FILE}`);
};

(async () => {
  try {
    await fetchAndSaveFiles();
    zipAllFiles();

    // Optional: Clean up
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary files.');

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
  }
})();
