/* eslint-disable no-unused-expressions */
import { deployAll } from "./deploy/deploy";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { network, ethers } from "hardhat";
import { ProxyAdmin, TestV1, TestV2, TransparentUpgradeableProxy } from "../typechain";
import { expect } from "chai";

const iface = new ethers.utils.Interface(["function initialize() public"]);

describe("컨트랙트 배포 및 등록 테스트", () => {
    let admin: SignerWithAddress;
    let user: SignerWithAddress[];
    let proxyAdmin: ProxyAdmin;
    // let proxy: TransparentUpgradeableProxy;
    let snapshotId: number;

    // Initial deployment function
    async function deployAndSet() {
        const deployed = await deployAll();

        ({ admin, user, proxyAdmin } = deployed);
    }

    before(async () => {
        await deployAndSet();
    });

    beforeEach(async () => {
        snapshotId = await network.provider.send("evm_snapshot");
    });

    afterEach(async () => {
        await network.provider.send("evm_revert", [snapshotId]);
    });

    describe("프록시 컨트랙 배포 및 업그레이드 테스트 🤔", () => {
        let implv1: TestV1;
        let implv2: TestV2;

        before(async () => {
            const ImplV1 = await ethers.getContractFactory("TestV1");
            implv1 = (await ImplV1.deploy()) as TestV1;
            await implv1.deployed();

            const ImplV2 = await ethers.getContractFactory("TestV2");
            implv2 = (await ImplV2.deploy()) as TestV2;
            await implv2.deployed();
        });

        it("프록시 컨트랙트 배포", async () => {
            const data = iface.encodeFunctionData("initialize");

            const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
            const proxy = (await Proxy.deploy(implv1.address, proxyAdmin.address, data)) as TransparentUpgradeableProxy;

            await proxy.deployed();

            expect(await proxyAdmin.getProxyAdmin(proxy.address)).to.equal(proxyAdmin.address);
            expect(await proxyAdmin.getProxyImplementation(proxy.address)).to.equal(implv1.address);

            expect((await proxy.deployed()).interface.getEvent("AdminChanged")).not.to.be.undefined;
            expect((await proxy.deployed()).interface.getEvent("BeaconUpgraded")).not.to.be.undefined;
            expect((await proxy.deployed()).interface.getEvent("Upgraded")).not.to.be.undefined;

            expect((await implv1.deployed()).interface.getEvent("Initialized")).not.to.be.undefined;
            expect((await implv1.deployed()).interface.getEvent("SetUp")).not.to.be.undefined;

            const proxyContract = implv1.attach(proxy.address);

            expect(await proxyContract.x()).to.equal(3);

            // upgrade
            const upgradeAndInitializeTx = proxyAdmin.upgradeAndCall(proxy.address, implv2.address, data);
            await expect(upgradeAndInitializeTx).to.revertedWith("Initializable: contract is already initialized");

            const upgradeTx = proxyAdmin.upgrade(proxy.address, implv2.address);

            await expect(upgradeTx).to.emit(proxy, "Upgraded").withArgs(implv2.address);
            await expect(upgradeTx).not.to.emit(implv2, "Initialized");

            const proxyContract2 = implv2.attach(proxy.address);

            expect(await proxyContract2.x()).to.equal(3);

            await proxyContract2.setY();

            expect(await proxyContract2.y()).to.equal(4);
        });
    });
});
