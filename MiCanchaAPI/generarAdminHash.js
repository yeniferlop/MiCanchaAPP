const bcrypt = require("bcrypt");

async function main() {
  const password = "Admin12345"; // ← esta será tu contraseña

  const hash = await bcrypt.hash(password, 10);

  console.log("HASH GENERADO:");
  console.log(hash);
}

main();