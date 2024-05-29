const { ZasContract } = require("../generated/src/Handlers.bs.js");
const { uidHash, nonceHash, todayTimestamp } = require('./utils');
const { TotalReward } = require('./config');

ZasContract.Attested.loader(({ event, context }) => {
  const chainId = event.chainId;
  let uid = event.params.uid.toString().toLowerCase();
  const schemaId = event.params.schema.toString().toLowerCase();
  const recipient = event.params.recipient.toString().toLowerCase();
  const nullifier = event.params.nullifier.toString().toLowerCase();

  uid = uidHash(uid, chainId);
  const nonce = nonceHash(schemaId, nullifier);

  context.Attestation.load(uid);
  context.Schema.load(schemaId);
  context.Nonce.load(nonce);
  context.UserReward.load(recipient);
  context.UserDailyReward.load(recipient);
  context.TotalReward.load(TotalReward.id);
  context.SchemaAttestationCounter.load(schemaId);
});

ZasContract.Attested.handler(({ event, context }) => {
  const chainId = event.chainId;
  const schemaId = event.params.schema.toString().toLowerCase();

  console.log(`attested for ${schemaId} on ${chainId} at blockTimestamp ${event.blockTimestamp}`);

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
    blockTimestamp: event.blockTimestamp,
    transactionHash: event.transactionHash
  };

  const schemaEntity = context.Schema.get(schemaId);
  let reward = schemaEntity.reward;

  let totalRewardEntity = context.TotalReward.get(TotalReward.id);
  if (!totalRewardEntity) {
    totalRewardEntity = {
      id: TotalReward.id,
      reward: TotalReward.reward,
    };
  }

  let schemaAttestationCounterEntity = context.SchemaAttestationCounter.get(schemaId);
  if (!schemaAttestationCounterEntity) {
    schemaAttestationCounterEntity = {
      id: schemaId,
      count: 1,
    }
  } else {
    schemaAttestationCounterEntity.count += 1;
  }

  let userRewardEntity = context.UserReward.get(recipient);
  if (!userRewardEntity) {
    userRewardEntity = {
      id: recipient,
      reward: 0,
      blockTimestamp: 0,
    };
  }

  let userDailyRewardEntity = context.UserDailyReward.get(recipient);
  if (!userDailyRewardEntity || userDailyRewardEntity.blockTimestamp < todayTimestamp()) {
    userDailyRewardEntity = {
      id: recipient,
      reward: 0,
      blockTimestamp: event.blockTimestamp,
    };
  }

  let nonceEntity = context.Nonce.get(nonce);
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
  userRewardEntity.blockTimestamp = event.blockTimestamp;

  userDailyRewardEntity.reward += reward;
  userDailyRewardEntity.blockTimestamp = event.blockTimestamp;

  attestationEntity.reward = reward;

  context.Attestation.set(attestationEntity);
  context.Nonce.set(nonceEntity);
  context.TotalReward.set(totalRewardEntity);
  context.UserReward.set(userRewardEntity);
  context.UserDailyReward.set(userDailyRewardEntity);
  context.SchemaAttestationCounter.set(schemaAttestationCounterEntity);
});

ZasContract.Revoked.loader(({ event, context }) => {
  const chainId = event.chainId;
  let uid = event.params.uid.toString().toLowerCase();
  const schemaId = event.params.schema.toString().toLowerCase();
  const recipient = event.params.recipient.toString().toLowerCase();
  const nullifier = event.params.nullifier.toString().toLowerCase();

  uid = uidHash(uid, chainId);
  const nonce = nonceHash(schemaId, nullifier);

  context.Attestation.load(uid);
  context.Nonce.load(nonce);
  context.TotalReward.load(TotalReward.id);
  context.UserReward.load(recipient);
  context.UserDailyReward.load(recipient);
  context.SchemaAttestationCounter.load(schemaId);
});

ZasContract.Revoked.handler(({ event, context }) => {
  const chainId = event.chainId;
  const schemaId = event.params.schema.toString().toLowerCase();

  // console.log(`revoked for ${schemaId} on ${chainId} at blockTimestamp ${event.blockTimestamp}`);

  let uid = event.params.uid.toString().toLowerCase();
  uid = uidHash(uid, chainId);

  const recipient = event.params.recipient.toString().toLowerCase();
  const nullifier = event.params.nullifier.toString().toLowerCase();
  const nonce = nonceHash(schemaId, nullifier);

  let attestationEntity = context.Attestation.get(uid);

  if (attestationEntity) {
    const reward = attestationEntity.reward;

    attestationEntity.revocationTime = event.blockTimestamp;
    attestationEntity.reward = 0;

    context.Attestation.set(attestationEntity);

    const nonceEntity = context.Nonce.get(nonce);
    nonceEntity.revocationTime = event.blockTimestamp;

    context.Nonce.set(nonceEntity);

    const userRewardEntity = context.UserReward.get(recipient);
    userRewardEntity.reward -= reward;

    context.UserReward.set(userRewardEntity);

    const userDailyRewardEntity = context.UserDailyReward.get(recipient);
    userDailyRewardEntity.reward -= reward;
    userDailyRewardEntity.blockTimestamp = event.blockTimestamp;

    context.UserDailyReward.set(userDailyRewardEntity);

    const totalRewardEntity = context.TotalReward.get(TotalReward.id);
    totalRewardEntity.reward += reward;

    context.TotalReward.set(totalRewardEntity);

    let schemaAttestationCounterEntity = context.SchemaAttestationCounter.get(schemaId);
    schemaAttestationCounterEntity.count -= 1;

    context.SchemaAttestationCounter.set(schemaAttestationCounterEntity);
  }
});
