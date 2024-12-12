const { Schema } = require("../generated");
const { parseSchemaData } = require('./utils');

Schema.SchemaRegistered.handler(async ({ event, context }) => {
  const uid = event.params.uid.toString().toLowerCase();

  console.log(`SchemaRegistered for ${uid} at blockTimestamp ${event.block.timestamp}`);

  let schemaEntity = await context.ZSchema.get(uid)
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
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    };

    context.ZSchema.set(schemaEntity);
  } else if (schemaEntity.revocationTime > 0) {
    schemaEntity.revocationTime = 0;

    context.ZSchema.set(schemaEntity);
  }
});

Schema.SchemaDataRevised.handler(async ({ event, context }) => {
  const uid = event.params.uid.toString().toLowerCase();

  // console.log(`SchemaDataRevised for ${uid} at blockTimestamp ${event.block.timestamp}`);

  let schemaEntity = await context.ZSchema.get(uid)
  if (schemaEntity) {
    const schemaData = parseSchemaData(event.params.schemaData);

    schemaEntity.category = schemaData.category;
    schemaEntity.dataSource = schemaData.dataSource;
    schemaEntity.reward = schemaData.reward;
    schemaEntity.checkIn = schemaData.checkIn;

    context.ZSchema.set(schemaEntity);
  }
});


Schema.SchemaRevoked.handler(async ({ event, context }) => {
  const uid = event.params.uid.toString().toLowerCase();

  // console.log(`SchemaRevoked for ${uid} at blockTimestamp ${event.block.timestamp}`);

  const schemaEntity = await context.ZSchema.get(uid);
  if (schemaEntity && schemaEntity.revocationTime == 0) {
    schemaEntity.revocationTime = event.block.timestamp;
    context.ZSchema.set(schemaEntity);
  }
});
