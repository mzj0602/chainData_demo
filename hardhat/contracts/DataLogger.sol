// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DataLogger
 * @notice 将加密后的 hex 数据永久记录到链上 Event Log
 */
contract DataLogger {
    event DataStored(
        address indexed sender,
        string  data,
        uint256 timestamp
    );

    /**
     * @notice 上链一条加密数据
     * @param data 加密后的 hex 字符串（如 "0x48656c6c6f"）
     */
    function storeData(string calldata data) external {
        require(bytes(data).length > 0, "DataLogger: empty data");
        emit DataStored(msg.sender, data, block.timestamp);
    }
}
