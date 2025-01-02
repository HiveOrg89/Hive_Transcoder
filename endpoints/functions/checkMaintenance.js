const supabaseServices = require("../SDKs/supabase");

const checkMaintananceStatus = async () => {
  const { supabase } = await supabaseServices();

  try {
    const { data, error } = await supabase
      .from("maintenance_schedule")
      .select("*")
      .eq("name", "transcoder_scheduler");

    if (error) {
      throw new Error(error.message); // Handling the error
    }

    // If data is found, return the first item, otherwise false
    return data?.[0] || false;
  } catch (err) {
    console.error("Error checking maintenance status:", err);
    return false;
  }
};

module.exports = checkMaintananceStatus;
