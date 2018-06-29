pragma solidity ^0.4.11;
contract Contract {

    event Message(address indexed _hashSender, uint _hashId, string _hashContent, uint timestamp);

    struct Hash {
        address sender;
        string content;
        uint timestamp;
    }

    mapping(uint => Hash) public hashes;
    uint public lastHashId;

    constructor() public {
    }

    function save(string _hashContent) public {
        uint id = ++lastHashId;
        hashes[id].sender = msg.sender;
        hashes[id].content = _hashContent;
        hashes[id].timestamp = block.timestamp;

        emit Message(hashes[id].sender, id, hashes[id].content, hashes[id].timestamp);
    }
}