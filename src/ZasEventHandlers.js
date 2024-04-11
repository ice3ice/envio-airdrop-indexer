const { ZasContract } = require("../generated/src/Handlers.bs.js");
const { uidHash, nonceHash } = require('./utils');

const TOTAL_REWARD_ID = "e573a447e86d91ef8e17f49bd1083b9107e32538627e0026ea5e16319702018c";
const totalRewardCount = 16000000;

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
  context.TotalReward.load(TOTAL_REWARD_ID);
  context.UserReward.load(recipient);
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

  let totalRewardEntity = context.TotalReward.get(TOTAL_REWARD_ID)
  if (!totalRewardEntity) {
    totalRewardEntity = {
      id: TOTAL_REWARD_ID,
      reward: totalRewardCount,
    };
  }

  let userRewardEntity = context.UserReward.get(recipient)
  if (!userRewardEntity) {
    userRewardEntity = {
      id: recipient,
      reward: 0,
      blockTimestamp: 0,
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

  attestationEntity.reward = reward;

  context.Attestation.set(attestationEntity);
  context.Nonce.set(nonceEntity);
  context.TotalReward.set(totalRewardEntity);
  context.UserReward.set(userRewardEntity);
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
  context.TotalReward.load(TOTAL_REWARD_ID);
  context.UserReward.load(recipient);
});

ZasContract.Revoked.handler(({ event, context }) => {
  const chainId = event.chainId;
  const schemaId = event.params.schema.toString().toLowerCase();

  console.log(`revoked for ${schemaId} on ${chainId} at blockTimestamp ${event.blockTimestamp}`);

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

    const totalRewardEntity = context.TotalReward.get(TOTAL_REWARD_ID);
    totalRewardEntity.reward += reward;

    context.TotalReward.set(totalRewardEntity);
  }
});
