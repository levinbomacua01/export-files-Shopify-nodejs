📦 Exporting Files from Shopify using Node.js

This Node.js project demonstrates how to fetch media files (such as images and files) from your Shopify store using the Shopify GraphQL Admin API, save them locally, and optionally zip them for easier download or backup.


✨ Features
<ul>
    <li>Fetch media files using Axios and GraphQL.</li>
    <li>Download and save images or generic files locally.</li>
    <li>Zip downloaded files into a single archive.</li>
    <li>Organized project structure for maintainability.</li>
</ul>

⚙️ Installation
1. Clone this repository or create your Node.js project.  
2. Navigate to the project directory.  
3. Install dependencies: <br>
   <code>npm install axios adm-zip</code>

<strong>Note:</strong> <code>fs</code> and <code>path</code> are built-in Node.js modules; no need to install them.

🔑 Setup
Before running the script, ensure you have:
<ul>
    <li>A Shopify store.</li>
    <li>Admin API access token with proper permissions.</li>
    <li>Your Storefront domain or Admin domain.</li>
</ul>

Create a <code>.env</code> file (or store securely) with:
<pre>
    API_VERSION='2025-04'
    SHOPIFY_STORE="storename.myshopify.com"
    ACCESS_TOKEN="shpat_XXXXXXXXXXXXXXXXXXXX"
</pre>


🛠 Usage
Update <code>index.js</code> with your query or logic to fetch media files.

Run the script:
<pre>node index.js</pre>

The script will:
<ul>
    <li>Fetch files from Shopify.</li>
    <li>Download them into the <code>/downloads</code> folder.</li>
    <li>Optionally zip them into an archive.</li>
</ul>


✅ Tips
<ul>
    <li>Adjust the GraphQL query to your needs (e.g., fetch products, collections, etc.).</li>
    <li>Always handle API rate limits (Shopify allows limited requests per second).</li>
    <li>Store your API token securely (never hardcode in code or commit to GitHub).</li>
</ul>
