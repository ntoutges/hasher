const $ = document.querySelector.bind(document);
import { Grid } from "./grid.js"

const firebaseConfig = {
  apiKey: "AIzaSyAlmlRfb-hMRaLGRiR62bS7b3n8-z3R7qQ",
  authDomain: "hashr-7d547.firebaseapp.com",
  projectId: "hashr-7d547",
  storageBucket: "hashr-7d547.appspot.com",
  messagingSenderId: "759411132666",
  appId: "1:759411132666:web:822e24eddab8ce6eb82143",
  measurementId: "G-4SE2G5D1TW"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

let init = false;
db.collection("hashes").onSnapshot(snapshot => {
    if (!init) return;
    snapshot.docChanges().forEach(change => {
        if (change.type != "added") return; // Ignore

        grid.add(change.doc.data(), true);
    })
});

function createHash(plaintext, type) {
    type = type.toUpperCase(); // Normalize

    return new Promise(async (resolve, reject) => {
        const digest = CryptoJS[type](plaintext).toString();

        db.collection("hashes").add({
            type,
            plaintext,
            digest,
            created: (new Date()).getTime()
        }).then(doc => resolve(doc.id)).catch(err => reject(err));
    });
}

const grid = new Grid($("#data"), $("template"))

let batch = null;
function lazyLoad(limit) {
    return new Promise((resolve, reject) => {

        // Construct query
        let query = db.collection("hashes").orderBy("created", "desc");
        if (batch) query = query.startAfter(batch);
        query = query.limit(limit);

        // Execute query
        query.get().then((docs) => {
            if (docs.empty) return [];
            
            docs = docs.docs;
            if (docs.length) batch = docs[docs.length - 1];
            resolve(docs.map(doc => doc.data()));
        }).catch(err => reject(err));
    });
}

let loading = false;
let toLoad = false;
async function loadMore(limit) {
    if (loading) {
        toLoad = true;
        return;
    }

    loading = true;

    const docs = await lazyLoad(limit);
    docs.forEach(doc => { grid.add(doc); });
    init = true;

    // Reset load-based data
    loading = false;
    toLoad = false;

    if (docs.length == 0) return;

    // More data to load: do it
    if (toLoad || grid.atBottom) setTimeout(() => loadMore(limit), 0);
}

loadMore(10);
grid.el.addEventListener("scroll", () => {
    loadMore(10);
});

fetch("./hashes.json").then(data => data.json()).then(hashes => {
    $("#hash-type").innerHTML = "";

    for (const type in hashes) {
        const opt = $("template").content.querySelector(".data-option").cloneNode(true);
        opt.textContent = hashes[type].name ?? type;
        opt.value = type;

        $("#hash-type").append(opt);
    }
});

$("#plaintext").addEventListener("input", () => {
    if ($("#plaintext").value.length) $("#hash").disabled = false;
    else $("#hash").disabled = true;
});

// Enter also generates the hash
$("#plaintext").addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        $("#hash").click();
    }
});

let hashing = false;
$("#hash").addEventListener("click", async () => {
    if (hashing) return;
    hashing = true;

    await createHash($("#plaintext").value, $("#hash-type").value);

    // Reset input
    $("#plaintext").value = "";
    $("#hash").disabled = true;
    hashing = false;
})
