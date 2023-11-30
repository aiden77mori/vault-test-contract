// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address[] private admins;
    mapping(address => bool) private whitelist;
    bool public paused;

    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event TokenWhitelisted(address indexed token);
    event TokenRemovedFromWhitelist(address indexed token);

    /**
     * @dev Throws if the sender is not the admin.
     */
    modifier onlyAdmins() {
        require(isAdmin(msg.sender), "Only admins can call this function");
        _;
    }

    /**
     * @dev Throws if the contract is paused
     */
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        admins.push(msg.sender);
    }

    /**
     * @dev Deposit token
     * @param token - token address to be deposited
     * @param amount - token amount to be deposited
     */
    function deposit(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(isWhitelisted(token), "Token is not whitelisted");
        require(amount > 0, "Amount must be greater than zero");
        require(
            IERC20(token).balanceOf(msg.sender) >= amount,
            "Not enough token to deposit"
        );

        SafeERC20.safeTransferFrom(
            IERC20(token),
            msg.sender,
            address(this),
            amount
        );

        emit Deposit(msg.sender, token, amount);
    }

    /**
     * @dev Withdraw token
     * @param token - token address to be withdrew
     * @param amount - token amount to be withdrew
     */
    function withdraw(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(isWhitelisted(token), "Token is not whitelisted");
        require(amount > 0, "Amount must be greater than zero");
        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "Not enough token to withdraw"
        );

        SafeERC20.safeTransfer(IERC20(token), msg.sender, amount);

        emit Withdrawal(msg.sender, token, amount);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyAdmins {
        require(!paused, "Contract is already paused");
        paused = true;
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyAdmins {
        require(paused, "Contract is not paused");
        paused = false;
    }

    /**
     * @dev Add token to whitelist
     * @param token - token address to be added to whitelist
     */
    function whitelistToken(address token) external onlyAdmins {
        require(!isWhitelisted(token), "Token is already whitelisted");

        whitelist[token] = true;
        emit TokenWhitelisted(token);
    }

    /**
     * @dev Remove token to whitelist
     * @param token - token address to be removed from whitelist
     */
    function removeTokenFromWhitelist(address token) external onlyAdmins {
        require(isWhitelisted(token), "Token is not whitelisted");

        whitelist[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }

    /**
     * @dev Add admin to admin list
     * @param newAdmin - new admin address
     */
    function addAdmin(address newAdmin) external onlyAdmins {
        require(!isAdmin(newAdmin), "Address is already an admin");

        admins.push(newAdmin);
        emit AdminAdded(newAdmin);
    }

    /**
     * @dev Remove admin from admin list
     * @param adminToRemove - admin address to be removed
     */
    function removeAdmin(address adminToRemove) external onlyAdmins {
        require(isAdmin(adminToRemove), "Address is not an admin");
        require(admins.length > 1, "Cannot remove the last admin");

        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == adminToRemove) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                emit AdminRemoved(adminToRemove);
                break;
            }
        }
    }

    /**
     * @dev Check account is admin
     * @param account - address to be checked
     */
    function isAdmin(address account) public view returns (bool) {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == account) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Check token is whitelisted
     * @param token - token to be checked
     */
    function isWhitelisted(address token) public view returns (bool) {
        return whitelist[token];
    }
}
