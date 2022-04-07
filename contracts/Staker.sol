//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staker is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 stakingPeriod = block.timestamp + 2 days;
    mapping(address => mapping(address => uint256)) public stakes;

    event Staked(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    function stake(uint256 _amount, address _tokenAddr) public {
        require(_amount >= 0, "amount must be greater than 0");
        stakes[msg.sender][_tokenAddr] = stakes[msg.sender][_tokenAddr].add(
            _amount
        );
        IERC20(_tokenAddr).safeTransferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _tokenAddr, _amount);
    }

    function unstake(address _tokenAddr) public stakingPeriodCompleted {
        uint256 balance = stakes[msg.sender][_tokenAddr];
        require(balance > 0, "staked balance cannot be 0");

        stakes[msg.sender][_tokenAddr] = 0;
        IERC20(_tokenAddr).safeTransferFrom(address(this), msg.sender, balance);
        emit Withdrawn(msg.sender, _tokenAddr, balance);
    }

    function timeLeft() public view returns (uint256) {
        if (block.timestamp >= stakingPeriod) {
            return 0;
        } else {
            return stakingPeriod.sub(block.timestamp);
        }
    }

    function getStakeOf(address _who, address _token)
        public
        view
        returns (uint256)
    {
        return stakes[_who][_token];
    }

    modifier stakingPeriodCompleted() {
        require(timeLeft() == 0, "staking period is not completed yet.");
        _;
    }
}
