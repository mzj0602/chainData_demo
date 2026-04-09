import { DataStored as DataStoredEvent } from "../generated/DataLogger/DataLogger";
import { DataStored } from "../generated/schema";

export function handleDataStored(event: DataStoredEvent): void {
  // 用 txHash + logIndex 组成唯一 ID
  let id = event.transaction.hash.concatI32(event.logIndex.toI32());

  let entity = new DataStored(id);
  entity.sender = event.params.sender;
  entity.data = event.params.data;
  entity.timestamp = event.params.timestamp;
  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
