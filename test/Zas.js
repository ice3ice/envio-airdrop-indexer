
const assert = require("assert");
const { MockDb, Schema, Zas } = require("../generated/src/TestHelpers.bs.js");
const { Addresses } = require("../generated/src/bindings/Ethers.bs.js");

const { TOTAL_REWARD_ID, TOTAL_REWARD, nextBlock, createSchemaRegisteredEvent, createMockZasAttestedEvent, createMockZasRevokedEvent, uidHash, nonceHash } = require("./utils");

const mockData = {
  chainId: 1,
  schema: {
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    schemaURI: "https://schema.zkpass.org/schema.json",
    schemaData: `{"category":"ca","dataSource":"ds","reward":10}`,
    reward: 10,
  },
  attestation: {
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29b",
    nullifier: "0xf1dc22f28f20a336838d91aea3da6749ccc0cd3ef5e985c2dd0788b310734dab",
  }
}

describe("ZAS contract event tests", () => {
  // Create mock db
  let mockDb = MockDb.createMockDb();

  const mockSchemaRegisteredEvent = createSchemaRegisteredEvent(mockData.chainId, mockData.schema.uid, mockData.schema.schemaURI, mockData.schema.schemaData)

  before(async () => {
    mockDb = Schema.SchemaRegistered.processEvent({
      event: mockSchemaRegisteredEvent,
      mockDb: mockDb,
    });
  });

  it("ZAS Attest", () => {
    nextBlock();

    let recipient = Addresses.defaultAddress;

    let mockZasAttestedEvent = createMockZasAttestedEvent(
      mockData.chainId, recipient, mockData.attestation.uid, mockData.schema.uid, mockData.attestation.nullifier);

    mockDb = Zas.Attested.processEvent({
      event: mockZasAttestedEvent,
      mockDb: mockDb,
    });

    let nonceEntity = mockDb.entities.Nonce.get(nonceHash(mockData.schema.uid, mockData.attestation.nullifier));
    assert.equal(nonceEntity.revocationTime, 0);

    let attestationEntity = mockDb.entities.Attestation.get(uidHash(mockData.attestation.uid, mockData.chainId));
    assert.equal(attestationEntity.revocationTime, 0);
    assert.equal(attestationEntity.reward, mockData.schema.reward);

    let userRewardEntity = mockDb.entities.UserReward.get(recipient.toLowerCase());
    assert.equal(userRewardEntity.id, recipient.toLowerCase());
    assert.equal(userRewardEntity.reward, mockData.schema.reward);

    let totalRewardEntity = mockDb.entities.TotalReward.get(TOTAL_REWARD_ID);
    assert.equal(totalRewardEntity.reward, TOTAL_REWARD - mockData.schema.reward);
  });

  it("ZAS Revoke", () => {
    let blockTimestamp = nextBlock();

    let recipient = Addresses.defaultAddress;

    const mockZasRevokedEvent = createMockZasRevokedEvent(
      mockData.chainId, recipient, mockData.attestation.uid, mockData.schema.uid, mockData.attestation.nullifier);

    mockDb = Zas.Revoked.processEvent({
      event: mockZasRevokedEvent,
      mockDb: mockDb,
    });

    let nonceEntity = mockDb.entities.Nonce.get(nonceHash(mockData.schema.uid, mockData.attestation.nullifier));
    assert.equal(nonceEntity.revocationTime, blockTimestamp);

    let attestationEntity = mockDb.entities.Attestation.get(uidHash(mockData.attestation.uid, mockData.chainId));
    assert.equal(attestationEntity.revocationTime, blockTimestamp);
    assert.equal(attestationEntity.reward, 0);

    let userRewardEntity = mockDb.entities.UserReward.get(recipient.toLowerCase());
    assert.equal(userRewardEntity.id, recipient.toLowerCase());
    assert.equal(userRewardEntity.reward, 0);

    let totalRewardEntity = mockDb.entities.TotalReward.get(TOTAL_REWARD_ID);
    assert.equal(totalRewardEntity.reward, TOTAL_REWARD);
  });

  it("ZAS Attest Duplicate", () => {
    nextBlock();

    let recipient = Addresses.defaultAddress;

    let chainId1 = mockData.chainId + 1;
    let chainId2 = mockData.chainId + 2;

    let mockZasAttestedEvent = createMockZasAttestedEvent(
      chainId1, recipient, mockData.attestation.uid, mockData.schema.uid, mockData.attestation.nullifier);

    mockDb = Zas.Attested.processEvent({
      event: mockZasAttestedEvent,
      mockDb: mockDb,
    });

    nextBlock();

    mockZasAttestedEvent = createMockZasAttestedEvent(
      chainId2, recipient, mockData.attestation.uid, mockData.schema.uid, mockData.attestation.nullifier);

    mockDb = Zas.Attested.processEvent({
      event: mockZasAttestedEvent,
      mockDb: mockDb,
    });

    let nonceEntity = mockDb.entities.Nonce.get(nonceHash(mockData.schema.uid, mockData.attestation.nullifier));
    assert.equal(nonceEntity.revocationTime, 0);

    let attestationEntity = mockDb.entities.Attestation.get(uidHash(mockData.attestation.uid, chainId1));
    assert.equal(attestationEntity.revocationTime, 0);
    assert.equal(attestationEntity.reward, mockData.schema.reward);

    attestationEntity = mockDb.entities.Attestation.get(uidHash(mockData.attestation.uid, chainId2));
    assert.equal(attestationEntity.revocationTime, 0);
    assert.equal(attestationEntity.reward, 0);

    let userRewardEntity = mockDb.entities.UserReward.get(recipient.toLowerCase());
    assert.equal(userRewardEntity.id, recipient.toLowerCase());
    assert.equal(userRewardEntity.reward, mockData.schema.reward);

    let totalRewardEntity = mockDb.entities.TotalReward.get(TOTAL_REWARD_ID);
    assert.equal(totalRewardEntity.reward, TOTAL_REWARD - mockData.schema.reward);
  });
});
