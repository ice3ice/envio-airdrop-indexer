
const assert = require("assert");
const { MockDb, Schema, Zas } = require("../generated/src/TestHelpers.bs.js");
const { Addresses } = require("../generated/src/bindings/Ethers.bs.js");

const { uidHash, nonceHash } = require("../src/utils");

const totalRewardId = "e573a447e86d91ef8e17f49bd1083b9107e32538627e0026ea5e16319702018c";

const createMockZasAttestedEvent = (schemaId, recipient, chainId) => {
  const uid = "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a";
  const nullifier = "0xa2b3121b74bb22b89f2b84a5e8a96739f51380d35989ac1b488b1b5d83c9b4aa";

  const mockZasAttestedEvent = Zas.Attested.createMockEvent({
    recipient,
    notary: "0x9D8A6eBaD8b76c6E25a00ab02EC685529Ee3e30e",
    allocator: "0x19a567b3b212a5b35bA0E3B600FbEd5c2eE9083d",
    uid,
    schema: schemaId,
    nullifier,
    mockEventData: {
      chainId: chainId,
      blockNumber: 1,
      blockTimestamp: 1,
      blockHash: 0x0000000000000000000000000000000000000000000000000000000000000000,
      srcAddress: Addresses.defaultAddress,
      transactionHash: 0x0000000000000000000000000000000000000000000000000000000000000000,
      transactionIndex: 0,
      logIndex: 0,
    },
  });

  return mockZasAttestedEvent;
}

describe("ZAS contract event tests", () => {
  // Create mock db
  let mockDb = MockDb.createMockDb();

  const mockSchemaRegisteredEvent = Schema.SchemaRegistered.createMockEvent({
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    registerer: "0x29f15c2bb9298a534d257d04ec70124b9d074113",
    schemaURI: "https://schema.zkpass.org/schema.json",
    schemaData: `{"category":"ca","dataSource":"ds","reward":10}`,
    revocable: true,
    mockEventData: {
      chainId: 1,
      blockNumber: 0,
      blockTimestamp: 0,
      blockHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      srcAddress: Addresses.defaultAddress,
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      transactionIndex: 0,
      logIndex: 0,
    },
  });

  const mockZasRevokedEvent = Zas.Revoked.createMockEvent({
    recipient: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    revoker: "0x29f15c2bb9298a534d257d04ec70124b9d074113",
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    schema: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    nullifier: "0xa2b3121b74bb22b89f2b84a5e8a96739f51380d35989ac1b488b1b5d83c9b4aa",
    mockEventData: {
      chainId: 1,
      blockNumber: 0,
      blockTimestamp: 12345,
      blockHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      srcAddress: Addresses.defaultAddress,
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      transactionIndex: 0,
      logIndex: 0,
    },
  });

  before(async () => {
    mockDb = Schema.SchemaRegistered.processEvent({
      event: mockSchemaRegisteredEvent,
      mockDb: mockDb,
    });
  });

  it("ZAS Attest", () => {
    console.log("attesting...")

    let mockZasAttestedEvent = createMockZasAttestedEvent("0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a", Addresses.defaultAddress, 1);

    mockDb = Zas.Attested.processEvent({
      event: mockZasAttestedEvent,
      mockDb: mockDb,
    });

    let nonceEntity = mockDb.entities.Nonce.get(nonceHash("0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a", "0xa2b3121b74bb22b89f2b84a5e8a96739f51380d35989ac1b488b1b5d83c9b4aa"));
    console.log(nonceEntity);

    let attestationEntity = mockDb.entities.Attestation.get(uidHash("0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a", 1));
    console.log(attestationEntity);

    let userRewardEntity = mockDb.entities.UserReward.get(
      mockZasAttestedEvent.params.recipient.toLowerCase()
    );

    console.log(userRewardEntity);

    let totalRewardEntity = mockDb.entities.TotalReward.get(
      totalRewardId
    );

    console.log(totalRewardEntity);
  });

  it("ZAS Revoke", () => {
    console.log("revoking...")

    mockDb = Zas.Revoked.processEvent({
      event: mockZasRevokedEvent,
      mockDb: mockDb,
    });

    let nonceEntity = mockDb.entities.Nonce.get(nonceHash("0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a", "0xa2b3121b74bb22b89f2b84a5e8a96739f51380d35989ac1b488b1b5d83c9b4aa"));
    console.log(nonceEntity);

    let attestationEntity = mockDb.entities.Attestation.get(uidHash("0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a", 1));
    console.log(attestationEntity);

    let userRewardEntity = mockDb.entities.UserReward.get(
      Addresses.defaultAddress.toLowerCase()
    );

    console.log(userRewardEntity);

    let totalRewardEntity = mockDb.entities.TotalReward.get(
      totalRewardId
    );

    console.log(totalRewardEntity);
  });
});
