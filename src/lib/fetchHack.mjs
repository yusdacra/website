// hack/postSync.mjs
/**
 ,* @file POST some stuff to a URL.
 ,* Usage: one of
 ,*   echo input | node postSync.mjs <url>
 ,*   node postSync.mjs <url> <input>
 ,*/

// The argument count would break if called as a standalone script.
const url = process.argv[2] || process.exit(1);

const response = await fetch(url, {method:'GET',redirect:'manual'});
const json = await response.text().then(text => {
    try {
        const data = JSON.parse(text);
        return data
    } catch(err) {
        return []
    }
});
console.log(JSON.stringify({
    location: response.headers.get('location'),
    status: response.status,
    body: json,
}));