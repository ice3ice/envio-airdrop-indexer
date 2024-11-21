const { Zas } = require("../generated");
const { uidHash, nonceHash, todayTimestamp } = require('./utils');
const { TotalReward } = require('./config');


Zas.Attested.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const schemaId = event.params.schema.toString().toLowerCase();

  // console.log(`attested for ${schemaId} on ${chainId} at blockTimestamp ${event.block.timestamp}`);

  let uid = event.params.uid.toString().toLowerCase();
  uid = uidHash(uid, chainId);

  const recipient = event.params.recipient.toString().toLowerCase();
  const nullifier = event.params.nullifier.toString().toLowerCase();
  const nonce = nonceHash(schemaId, nullifier);

  const attestationEntity = {
    id: uid,
    chainId,
    schemaId,
    nullifier,
    recipient,
    revocationTime: 0,
    reward: 0,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  const schemaEntity = await context.ZSchema.get(schemaId);
  let reward = schemaEntity.reward;

  let totalRewardEntity = await context.TotalReward.get(TotalReward.id);
  if (!totalRewardEntity) {
    totalRewardEntity = {
      id: TotalReward.id,
      reward: TotalReward.reward,
    };
  }

  let schemaAttestationCounterEntity = await context.SchemaAttestationCounter.get(schemaId);
  if (!schemaAttestationCounterEntity) {
    schemaAttestationCounterEntity = {
      id: schemaId,
      count: 1,
    }
  } else {
    schemaAttestationCounterEntity.count += 1;
  }

  let userRewardEntity = await context.UserReward.get(recipient);
  if (!userRewardEntity) {
    userRewardEntity = {
      id: recipient,
      reward: 0,
      blockTimestamp: 0,
    };
  }

  let userDailyRewardEntity = await context.UserDailyReward.get(recipient);
  if (!userDailyRewardEntity || userDailyRewardEntity.blockTimestamp < todayTimestamp()) {
    userDailyRewardEntity = {
      id: recipient,
      reward: 0,
      blockTimestamp: event.block.timestamp,
    };
  }

  let nonceEntity = await context.Nonce.get(nonce);
  if (!nonceEntity) {
    nonceEntity = {
      id: nonce,
      revocationTime: 0,
    }
  } else if (nonceEntity.revocationTime > 0) {
    nonceEntity.revocationTime = 0;
  } else {
    reward = 0;
  }

  if (totalRewardEntity.reward <= 0 || totalRewardEntity.reward < schemaEntity.reward) {
    reward = 0;
  }

  totalRewardEntity.reward -= reward;

  userRewardEntity.reward += reward;
  userRewardEntity.blockTimestamp = event.block.timestamp;

  userDailyRewardEntity.reward += reward;
  userDailyRewardEntity.blockTimestamp = event.block.timestamp;

  attestationEntity.reward = reward;

  context.Attestation.set(attestationEntity);
  context.Nonce.set(nonceEntity);
  context.TotalReward.set(totalRewardEntity);
  context.UserReward.set(userRewardEntity);
  context.UserDailyReward.set(userDailyRewardEntity);
  context.SchemaAttestationCounter.set(schemaAttestationCounterEntity);
});

Zas.Revoked.handler(async ({ event, context }) => {
  const chainId = event.chainId;
  const schemaId = event.params.schema.toString().toLowerCase();

  // console.log(`revoked for ${schemaId} on ${chainId} at blockTimestamp ${event.blockTimestamp}`);

  let uid = event.params.uid.toString().toLowerCase();
  uid = uidHash(uid, chainId);

  const recipient = event.params.recipient.toString().toLowerCase();
  const nullifier = event.params.nullifier.toString().toLowerCase();
  const nonce = nonceHash(schemaId, nullifier);

  let attestationEntity = await context.Attestation.get(uid);

  if (attestationEntity) {
    const reward = attestationEntity.reward;

    attestationEntity.revocationTime = event.block.timestamp;
    attestationEntity.reward = 0;

    context.Attestation.set(attestationEntity);

    const nonceEntity = await context.Nonce.get(nonce);
    nonceEntity.revocationTime = event.block.timestamp;

    context.Nonce.set(nonceEntity);

    const userRewardEntity = await context.UserReward.get(recipient);
    userRewardEntity.reward -= reward;

    context.UserReward.set(userRewardEntity);

    const userDailyRewardEntity = await context.UserDailyReward.get(recipient);
    userDailyRewardEntity.reward -= reward;
    userDailyRewardEntity.blockTimestamp = event.block.timestamp;

    context.UserDailyReward.set(userDailyRewardEntity);

    const totalRewardEntity = await context.TotalReward.get(TotalReward.id);
    totalRewardEntity.reward += reward;

    context.TotalReward.set(totalRewardEntity);

    let schemaAttestationCounterEntity = await context.SchemaAttestationCounter.get(schemaId);
    schemaAttestationCounterEntity.count -= 1;

    context.SchemaAttestationCounter.set(schemaAttestationCounterEntity);
  }
});
