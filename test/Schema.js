
const assert = require("assert");
const { MockDb, Schema } = require("../generated/src/TestHelpers.bs.js");
const { Addresses } = require("../generated/src/bindings/Ethers.bs.js");
const { timeStamp } = require("console");

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
      srcAddress: Addresses.defaultAddress,
      logIndex: 0,
      block: {
        number: 0,
        timestamp: 0,
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000"
      },
      transaction: {
        index: 0,
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000"
      },
    },
  });

  const mockSchemaDataRevisedEvent = Schema.SchemaDataRevised.createMockEvent({
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    schemaData: `{"category":"ca2","dataSource":"ds2","reward":100,"checkIn":false}`,
    revocable: true,
    mockEventData: {
      chainId: 1,
      srcAddress: Addresses.defaultAddress,
      logIndex: 0,
      block: {
        number: 0,
        timestamp: 0,
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000"
      },
      transaction: {
        index: 0,
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000"
      },
    },
  });

  const mockSchemaRevokedEvent = Schema.SchemaRevoked.createMockEvent({
    uid: "0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a",
    mockEventData: {
      chainId: 1,
      srcAddress: Addresses.defaultAddress,
      logIndex: 0,
      block: {
        number: 1,
        timestamp: 1,
        hash: "0x0000000000000000000000000000000000000000000000000000000000000001"
      },
      transaction: {
        index: 1,
        hash: "0x0000000000000000000000000000000000000000000000000000000000000001"
      },
    },
  });

  it("Schema Register", async () => {
    mockDb = await Schema.SchemaRegistered.processEvent({
      event: mockSchemaRegisteredEvent,
      mockDb: mockDb,
    });

    const schemaEntity = await mockDb.entities.ZSchema.get(
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
      transactionHash: undefined,
      // transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
  });

  it("Schema Data Revised", async () => {
    mockDb = await Schema.SchemaDataRevised.processEvent({
      event: mockSchemaDataRevisedEvent,
      mockDb: mockDb,
    });

    const schemaEntity = await mockDb.entities.ZSchema.get(
      mockSchemaDataRevisedEvent.params.uid
    );

    assert.deepEqual(schemaEntity, {
      id: '0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a',
      schemaURI: 'https://schema.zkpass.org/schema.json',
      revocationTime: 0,
      category: 'ca2',
      dataSource: 'ds2',
      reward: 100,
      checkIn: false,
      blockTimestamp: 0,
      transactionHash: undefined,
      // transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
  });

  it("Schema Revoke", async () => {
    mockDb = await Schema.SchemaRevoked.processEvent({
      event: mockSchemaRevokedEvent,
      mockDb: mockDb,
    });

    const schemaEntity = await mockDb.entities.ZSchema.get(
      mockSchemaRevokedEvent.params.uid
    );

    assert.deepEqual(schemaEntity, {
      id: '0x015fff34ed9865961f2c032e66c86cdcb3328f2f9acae1bc9ba40484c0d9c29a',
      schemaURI: 'https://schema.zkpass.org/schema.json',
      revocationTime: 1,
      category: 'ca2',
      dataSource: 'ds2',
      reward: 100,
      checkIn: false,
      blockTimestamp: 0,
      transactionHash: undefined,
      // transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
  });
});
