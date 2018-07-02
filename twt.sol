pragma solidity ^0.4.11;
contract Contract {

    event Message(address indexed sender, uint id, string cid, string img, uint timestamp);
    event Avatar(address indexed sender, string cid);

    struct Hash {
        address sender;
        string content;
        string image;
        uint timestamp;
    }

    mapping(address => string) public avatars;
    mapping(uint => Hash) public hashes;
    uint public lastHashId;

    constructor() public {
    }

    function post(string _hashContent, string _hashImage) public {
        uint id = ++lastHashId;
        hashes[id].sender = msg.sender;
        hashes[id].content = _hashContent;
        hashes[id].image = _hashImage;
        hashes[id].timestamp = block.timestamp;

        emit Message(hashes[id].sender, id, hashes[id].content, hashes[id].image, hashes[id].timestamp);
    }

    function set_avatar(string _hashAvatar) public {
        avatars[msg.sender] = _hashAvatar;

        emit Avatar(msg.sender, _hashAvatar);
    }
}