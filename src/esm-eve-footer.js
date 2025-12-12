const eve = __eveGlobal.eve_ia || __eveGlobal.eve;

if (!__eveGlobal.eve) {
    __eveGlobal.eve = eve;
}

if (!__eveGlobal.eve_ia) {
    __eveGlobal.eve_ia = eve;
}

export { eve as default, eve };
