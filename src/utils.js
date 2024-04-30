const ethers = require("ethers");
const moment = require("moment");

const parseSchemaData = (schemaData) => {
  let obj = null;
  try {
    obj = JSON.parse(schemaData);
  } catch (err) {
    return {
      category: "error",
      dataSource: "error",
      reward: 0,
      checkIn: false
    }
  }

  return {
    category: obj.category,
    dataSource: obj.dataSource,
    reward: obj.reward,
    checkIn: obj.checkIn ? true : false
  };
}

const uidHash = (uid, chainId) => {
  uid = uid.split("0x")[1];

  chainId = chainId.toString();

  uid = ethers.keccak256(Buffer.from(uid + chainId, "utf-8"));

  return "0x" + uid;
}

const nonceHash = (schemaId, nullifier) => {
  schemaId = schemaId.split("0x")[1];
  nullifier = nullifier.split("0x")[1];

  const nonce = ethers.keccak256(Buffer.from(schemaId + nullifier, "utf-8"));

  return "0x" + nonce;
}

const todayTimestamp = () => {
  return moment().startOf("day").unix();
}

module.exports = {
  parseSchemaData,
  uidHash,
  nonceHash,
  todayTimestamp,
};
