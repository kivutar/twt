var web3Instance = new Web3(Web3.givenProvider || Web3.currentProvider || 'https://rinkeby.infura.io');
web3Instance.eth.defaultAccount = web3Instance.eth.coinbase;

var ABI = [{ "constant": false, "inputs": [{ "name": "_hashContent", "type": "string" }, { "name": "_hashImage", "type": "string" }], "name": "post", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "uint256" }], "name": "hashes", "outputs": [{ "name": "sender", "type": "address" }, { "name": "content", "type": "string" }, { "name": "image", "type": "string" }, { "name": "timestamp", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "lastHashId", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_hashAvatar", "type": "string" }], "name": "set_avatar", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "avatars", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "sender", "type": "address" }, { "indexed": false, "name": "id", "type": "uint256" }, { "indexed": false, "name": "cid", "type": "string" }, { "indexed": false, "name": "img", "type": "string" }, { "indexed": false, "name": "timestamp", "type": "uint256" }], "name": "Message", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "sender", "type": "address" }, { "indexed": false, "name": "cid", "type": "string" }], "name": "Avatar", "type": "event" }]
var contractAddress = "0x5e626b58388f8b083d6d399f385c901675636b6e";
var contract = new web3Instance.eth.Contract(ABI, contractAddress);
var gateway = "https://ipfs.io/ipfs/";

const ipfsNode = window.ipfs; /*|| new Ipfs({
    repo: 'twt',
});*/

const readUploadedFileAsArrayBuffer = (file) => {
  const r = new FileReader();

  return new Promise((resolve, reject) => {
      r.onerror = () => {
          r.abort();
          reject(new DOMException("Problem parsing input file."));
      };

      r.onload = () => {
          resolve(r.result);
      };
      r.readAsArrayBuffer(file);
  });
};

async function post(message) {
  var messageHash, attachmentHash = '';
  if (message) {
      var err, files = await ipfsNode.files.add({ path: '/message', content: Buffer.from(message) });
      messageHash = files[0].hash;
      ipfsNode.pin.add(messageHash, (err) => console.log(err));
  }

  var file = document.querySelector('input[type=file]').files[0];
  if (file) {
      var buf = await readUploadedFileAsArrayBuffer(file);
      var err, files = await ipfsNode.files.add({ path: '/attachment', content: Buffer.from(buf) });
      attachmentHash = files[0].hash;
      ipfsNode.pin.add(attachmentHash, (err) => console.log(err));
  }

  console.log("Posting", messageHash, attachmentHash);
  var err, result = await contract.methods.post(messageHash, attachmentHash).send({ from: web3.eth.defaultAccount });
  console.log(err, result);
}

// function setAvatar(hash) {
//     contract.methods.set_avatar(hash).send({ from: web3.eth.defaultAccount }, function (err, result) {
//         console.log(err, result);
//     });
// }

//setAvatar("zb2rhoTVGCTVkcUSnqsqHybw8bP7ENvEpRL9e5yBgogWTPm1o");

function previewFile() {
  var file = document.querySelector('input[type=file]').files[0];
  var reader = new FileReader();

  reader.addEventListener("load", function () {
      document.querySelector(".preview-container").innerHTML += `<img class="preview" src="">`;
      var preview = document.querySelector('img.preview');
      preview.src = reader.result;
  }, false);

  if (file) {
      reader.readAsDataURL(file);
  }
}

function formatMessage(id, sender, content, img, timestamp) {
  return '' +
      '<img class="avatar" src="avatar.jpg">' +
      '<div class="sender">' +
      '<a href="?u=' + sender + '">Anonymous</a> ' +
      '<span>@' + sender.substring(2, 10) + '</span>' +
      ' · <span>' + new Date(timestamp * 1000).toLocaleString() + '</span>' +
      '</div>' +
      '<div class="content">' + content + '</div>' +
      (img ? '<img class="image" src="image.png">' : '') +
      '<div class="actions">' +
      '<a href=""><i class="fas fa-comment-alt"></i></a>' +
      '<a href=""><i class="fas fa-retweet"></i></a>' +
      '<a href=""><i class="fas fa-heart"></i></a>' +
      '<a href=""><i class="fas fa-thumbtack"></i></a>' +
      '<a href=""><i class="fas fa-envelope"></i></a>' +
      '</div>';
}

function insertMessage(id, sender, content, img, timestamp) {
  document.getElementById("messages").innerHTML = '' +
      '<div id="twt-' + id + '">' +
      formatMessage(id, sender, content, img, timestamp) +
      '</div>' + document.getElementById("messages").innerHTML;
}

function updateMessage(id, content) {
  document.querySelector("#twt-" + id + " .content").innerHTML = content;
}

async function retrieveMessage(id, cid) {
  console.log("Retrieving message " + cid);
  if (ipfsNode) {
      var err, file = await ipfsNode.files.cat(cid);
      if (err) {
          console.log(err);
          updateMessageFallback(id, cid);
      } else {
          updateMessage(id, file.toString('utf8'));
      }
  } else {
      updateMessageFallback(id, cid);
  }
}

async function retrieveImage(id, cid, selector) {
  console.log("Retrieving image " + cid);
  if (ipfsNode) {
      var err, file = await ipfsNode.files.cat(cid);
      if (err) {
          document.querySelector(selector).src = gateway + cid;
      } else {
          var blob = new Blob([file]);
          var url = window.URL.createObjectURL(blob);
          document.querySelector(selector).src = url;
      }
  } else {
      document.querySelector(selector).src = gateway + cid;
  }
}

async function findAvatar(id, sender) {
  var err, cid = await contract.methods.avatars(sender).call();
  cid && retrieveImage(id, cid, "#twt-" + id + " .avatar");
}

function updateMessageFallback(id, cid) {
  fetch(gateway + cid)
      .then(function (response) {
          return response.text();
      })
      .then(function (text) {
          updateMessage(id, text);
      })
}

function buildTweetList(filter) {
  contract.getPastEvents('Message', { fromBlock: 0, filter: filter }, (err, messages) => {
      messages.forEach(function (event) {
          var id = event.returnValues.id;
          var sender = event.returnValues.sender;
          var img = event.returnValues.img;
          insertMessage(id, sender, "<i>Loading...</i>", img, event.returnValues.timestamp);
          retrieveMessage(id, event.returnValues.cid);
          findAvatar(id, sender);
          if (img) {
              retrieveImage(id, img, "#twt-" + id + " .image");
          }
      });
  });
}

new Vue({
    el: '#twt',
    data: {
        message: '',
        attachment: '',
        placeholder: "What's on your mind?",
        hasFocus: false,
        u: new URLSearchParams(window.location.search).get('u')
    },
    methods: {
        submitPost: function () {
            post(this.$data.message);
        }
    }
})

var u = new URLSearchParams(window.location.search).get('u');
buildTweetList({ sender: u });