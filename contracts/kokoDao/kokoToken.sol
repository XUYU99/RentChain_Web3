// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {AccessControl} from "../openzeppelin/access/AccessControl.sol";
import {ERC20} from "../openzeppelin/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "../openzeppelin/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "../openzeppelin/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "../openzeppelin/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "../openzeppelin/utils/Nonces.sol";

import "hardhat/console.sol";

contract kokoToken is
    ERC20,
    ERC20Burnable,
    AccessControl,
    ERC20Permit,
    ERC20Votes
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        address defaultAdmin,
        address minter
    ) ERC20("kokoToken", "KO") ERC20Permit("kokoToken") {
        console.log("kokoToken-constructor()-msg.sender", msg.sender);
        console.log("kokoToken-constructor()-address(this)", address(this));
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        mint(msg.sender, 100 * (10 ** uint256(decimals())));
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        _delegate(to, to);
        console.log("kokoToken-mint()-balanceOf(to):", balanceOf(to));
    }

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
