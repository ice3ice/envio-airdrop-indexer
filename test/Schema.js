
const assert = require("assert");
const { MockDb, Schema } = require("../generated/src/TestHelpers.bs.js");
const { Addresses } = require("../generated/src/bindings/Ethers.bs.js");

describe("Schema contract event tests", () => {
  // Create mock db
  let mockDb = MockDb.createMockDb();

  const mockSchemaRegisteredEvent = Schema.SchemaRegistered.createMockEvent({
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    registerer: "0x29f15c2bb9298a534d257d04ec70124b9d074113",
    schemaURI: "https://schema.zkpass.org/schema.json",
    schemaData: `{"category":"ca","dataSource":"ds","reward":10,"checkIn":true}`,
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

  const mockSchemaRevokedEvent = Schema.SchemaRevoked.createMockEvent({
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    mockEventData: {
      chainId: 1,
      blockNumber: 1,
      blockTimestamp: 1,
      blockHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
      srcAddress: Addresses.defaultAddress,
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
      transactionIndex: 1,
      logIndex: 0,
    },
  });

  it("Schema Register", () => {
    mockDb = Schema.SchemaRegistered.processEvent({
      event: mockSchemaRegisteredEvent,
      mockDb: mockDb,
    });

    const schemaEntity = mockDb.entities.Schema.get(
      mockSchemaRegisteredEvent.params.uid
    );

    assert.deepEqual(schemaEntity, {
      id: '0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a',
      schemaURI: 'https://schema.zkpass.org/schema.json',
      revocationTime: 0,
      category: 'ca',
      dataSource: 'ds',
      reward: 10,
      checkIn: true,
      blockTimestamp: 0,
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
  });

  it("Schema Revoke", () => {
    mockDb = Schema.SchemaRevoked.processEvent({
      event: mockSchemaRevokedEvent,
      mockDb: mockDb,
    });

    const schemaEntity = mockDb.entities.Schema.get(
      mockSchemaRevokedEvent.params.uid
    );

    assert.deepEqual(schemaEntity, {
      id: '0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a',
      schemaURI: 'https://schema.zkpass.org/schema.json',
      revocationTime: 1,
      category: 'ca',
      dataSource: 'ds',
      reward: 10,
      checkIn: true,
      blockTimestamp: 0,
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
  });
});
