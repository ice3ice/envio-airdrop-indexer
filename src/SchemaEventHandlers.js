const { SchemaContract } = require("../generated/src/Handlers.bs.js");
const { parseSchemaData } = require('./utils');

SchemaContract.SchemaRegistered.loader(({ event, context }) => {
  const uid = event.params.uid.toString().toLowerCase();
  context.Schema.load(uid);
});

SchemaContract.SchemaRegistered.handler(({ event, context }) => {
  const uid = event.params.uid.toString().toLowerCase();

  console.log(`SchemaRegistered for ${uid} at blockTimestamp ${event.blockTimestamp}`);

  let schemaEntity = context.Schema.get(uid)
  if (!schemaEntity) {
    const schemaData = parseSchemaData(event.params.schemaData);

    schemaEntity = {
      id: uid,
      schemaURI: event.params.schemaURI,
      category: schemaData.category,
      dataSource: schemaData.dataSource,
      reward: schemaData.reward,
      checkIn: schemaData.checkIn,
      revocationTime: 0,
      blockTimestamp: event.blockTimestamp,
      transactionHash: event.transactionHash
    };

    context.Schema.set(schemaEntity);
  } else if (schemaEntity.revocationTime > 0) {
    schemaEntity.revocationTime = 0;

    context.Schema.set(schemaEntity);
  }
});

SchemaContract.SchemaRevoked.loader(({ event, context }) => {
  const uid = event.params.uid.toString().toLowerCase();
  context.Schema.load(uid);
});

SchemaContract.SchemaRevoked.handler(({ event, context }) => {
  const uid = event.params.uid.toString().toLowerCase();

  console.log(`SchemaRevoked for ${uid} at blockTimestamp ${event.blockTimestamp}`);

  const schemaEntity = context.Schema.get(uid);
  if (schemaEntity && schemaEntity.revocationTime == 0) {
    schemaEntity.revocationTime = event.blockTimestamp;
    context.Schema.set(schemaEntity);
  }
});
