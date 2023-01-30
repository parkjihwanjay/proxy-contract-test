import { ethers, upgrades, network } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ProxyAdmin, TransparentUpgradeableProxy } from "../../typechain";
import HardhatUtil from "../hardhat.util";
import { getProxyAdminFactory } from "@openzeppelin/hardhat-upgrades/dist/utils";

export interface RT {
    admin: SignerWithAddress;
    user: SignerWithAddress[];
    proxyAdmin: ProxyAdmin;
}

let admin: SignerWithAddress;
let user: SignerWithAddress[];
let proxyAdmin: ProxyAdmin;

let isCached = false;

export const deployAll = async (): Promise<RT> => {
    /// 계정 설정
    if (isCached) {
        return {
            admin,
            user,
            proxyAdmin,
        };
    }

    [admin, ...user] = await ethers.getSigners();

    /// ////////////////////////////////////////
    /// 컨트랙트 배포
    /// ////////////////////////////////////////

    const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
    proxyAdmin = (await ProxyAdmin.deploy()) as ProxyAdmin;
    await proxyAdmin.deployed();

    /// ////////////////////////////////////////
    /// 최초 설정
    /// ////////////////////////////////////////

    isCached = true;

    return {
        admin,
        user,
        proxyAdmin,
    };
};
