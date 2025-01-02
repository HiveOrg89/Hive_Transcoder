const AWS = require("aws-sdk");
const checkRunningInstances = require("./checkRunningInstances");
const { setUpTranscodingJobs } = require("../transcoder");
const getSecrets = require("../secrets/secrets");
const AWSServices = require("../SDKs/AWS");
require("dotenv").config();

let retries = 0;

const terminateInstance = async (instanceId) => {
  const { ec2, ASG } = await AWSServices();
  const secrets = await getSecrets();

  try {
    const asgName = secrets.ASG_NAME;
    // Get the current desired capacity of the Auto Scaling Group
    const asgData = await ASG.describeAutoScalingGroups({
      AutoScalingGroupNames: [asgName],
    }).promise();

    const currentDesiredCapacity = asgData.AutoScalingGroups[0].DesiredCapacity;

    if (currentDesiredCapacity > 0) {
      // Reduce the desired capacity by one
      await ASG.updateAutoScalingGroup({
        AutoScalingGroupName: asgName,
        DesiredCapacity: currentDesiredCapacity - 1,
      }).promise();

      console.log(
        `Reduced desired capacity of ASG '${asgName}' to ${
          currentDesiredCapacity - 1
        }`
      );
    } else {
      console.log(
        `Desired capacity for ASG '${asgName}' is already at minimum.`
      );
    }

    // Check the state of the instance
    const instanceData = await ec2
      .describeInstances({ InstanceIds: [instanceId] })
      .promise();
    const state = instanceData.Reservations[0].Instances[0].State.Name;

    if (state === "running") {
      // Terminate the instance
      await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise();
      console.log(`Terminated instance: ${instanceId}`);
    } else {
      console.log(
        `Instance ${instanceId} is already in the desired state: ${state}`
      );
    }
  } catch (error) {
    console.error(`Error terminating instance: ${error.message}`);
  }
};

const stopInstance = async (instanceId) => {
  const { ec2 } = await AWSServices();

  const otherRunningInstancesExist = await checkRunningInstances();
  if (otherRunningInstancesExist) {
    setUpTranscodingJobs([]);
    return;
  }
  const instanceData = await ec2
    .describeInstances({ InstanceIds: [instanceId] })
    .promise();
  const state = instanceData.Reservations[0].Instances[0].State.Name;

  if (state === "running") {
    await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
    console.log(`Stopped instance: ${instanceId}`);
  } else {
    console.log(
      `Instance ${instanceId} is already in the desired state: ${state}`
    );
  }
};
const shutInstance = async () => {
  const secrets = await getSecrets();

  try {
    const { getInstanceId } = require("./getInstanceId");
    const thisInstanceId = await getInstanceId();
    const instanceId = secrets.AWS_ORIGINAL_INSTANCE_ID;
    if (instanceId !== thisInstanceId) {
      terminateInstance(thisInstanceId);
    } else {
      stopInstance(instanceId);
    }
  } catch (error) {
    retries++;
    console.error("Error stopping instance:", error);
    if (retries < 10) {
      shutInstance();
    }
  }
};

module.exports = shutInstance;
