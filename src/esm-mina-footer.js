const mina = __minaGlobal.mina;

if (!mina) {
    throw new Error("mina failed to initialize");
}

export { mina as default, mina };
