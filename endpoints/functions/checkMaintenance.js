const supabaseServices = require("../SDKs/supabase");

const checkMaintananceStatus = async () => {
  const { supabase } = await supabaseServices();

  const { data, error } = await supabase
    .from("maintenance_schedule")
    .select("*");

  if (data) {
    return data[0];
  }
  return false;
};

module.exports = checkMaintananceStatus;
