    return Snap;
});

const eve = __snapGlobal.eve_ia || __snapGlobal.eve;
const mina = __snapGlobal.mina;

if (!__snapGlobal.Snap) {
    __snapGlobal.Snap = Snap;
}

if (!__snapGlobal.Snap_ia) {
    __snapGlobal.Snap_ia = Snap;
}

export { Snap as default, Snap, mina, eve };
