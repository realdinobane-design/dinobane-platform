import asyncio
from playwright.async_api import async_playwright

passed = failed = 0
def chk(name, cond, info=""):
    global passed, failed
    if cond:
        passed += 1; print("PASS", name)
    else:
        failed += 1; print("FAIL", name, "—", info)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/chromium",
            args=["--no-sandbox","--disable-gpu","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":1600,"height":900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("http://localhost:8901/index.html", wait_until="domcontentloaded")

        # ---- cinematic intro: zoomed-out pulsing web + title, then fade + dive ----
        await pg.wait_for_timeout(900)
        it = await pg.evaluate("(()=>{const el=document.getElementById('introT');return el?el.textContent:null})()")
        chk("intro overlay shows UK POWER MAP", it == "UK POWER MAP", it)
        sc = await pg.evaluate("scale/FIT.s")
        chk("intro starts zoomed out (<0.6 of fit)", sc < 0.6, sc)
        await pg.wait_for_timeout(7500)   # ~8.4s: title faded, dive done
        chk("intro overlay removed after fade", await pg.query_selector("#intro") is None)
        sc = await pg.evaluate("scale/FIT.s")
        chk("dive lands at fit (map fills screen)", 0.75 < sc < 1.15, sc)

        # ---- header / branding ----
        stats = await pg.text_content("#stats")
        chk("stats 80/131", "80 nodes" in stats and "131 connections" in stats, stats)
        chk("map title in bar", "UK POWER MAP" in (await pg.text_content("#maptitle")), "")
        chk("brand bar + DINOBANE", "DINOBANE" in (await pg.text_content("#brand")), "")
        chk("exit link to homepage", "dinobane.com" in (await pg.get_attribute("#exitb", "href")), "")
        chk("brand logo link", "dinobane.com" in (await pg.get_attribute("#brand", "href")), "")

        # ---- geometry ----
        chk("SPREAD 9", await pg.evaluate("SPREAD") == 9)
        chk("flat chart YSQ=1", await pg.evaluate("YSQ") == 1)
        radii = await pg.evaluate("Object.fromEntries(['wef','israel_state','pakistan','islam','qatar','uae'].map(k=>[k,Math.round(Math.hypot(POS[k][0],POS[k][1]))]))")
        chk("central ring r~918 (inner +70%)", all(916 <= v <= 920 for v in radii.values()), str(radii))
        rings = await pg.evaluate("RINGS.map(r=>r[0]).join(',')")
        chk("inner rings x1.7, outer stays 6750", rings == "918,1989,3060,3749,4055,4361,4896,6750", rings)

        # ---- data integrity ----
        ne = await pg.evaluate("[N.length,E.length,SAT.length]")
        chk("80 nodes / 131 edges / 68 sats", ne == [80,131,68], str(ne))
        sc6 = await pg.evaluate("[['tories','zahawitax'],['cashhonours','lubner'],['gaza_doc','ofcom'],['ofcom','farage'],['tories','lebedev'],['johnson','covidcontracts'],['grooming','mahmood']].map(p=>E.some(e=>(e[0]===p[0]&&e[1]===p[1])||(e[0]===p[1]&&e[1]===p[0])))")
        chk("scandal edges incl mahmood-grooming", all(sc6), str(sc6))
        lgg = await pg.evaluate("LGROUPGEO.map(g=>g.name).join('|')")
        chk("4 local groups", lgg.count("|") == 3 and "TECH BROS" in lgg and "EPSTEIN WEB" in lgg, lgg)
        rob = await pg.evaluate("E.some(e=>e[0]==='epstein'&&e[1]==='robinson')&&E.some(e=>e[0]==='bannon'&&e[1]==='robinson')")
        chk("robinson wired into epstein web", rob)
        mc = await pg.evaluate("CONTRO.mahmood.length")
        chk("mahmood has 4 controversies", mc == 4, mc)
        satok = await pg.evaluate("SAT.some(s=>s[0]==='mb'&&s[1]==='Daud Abdullah')")
        chk("Daud Abdullah satellite present", satok)

        # ---- pin scaling + satellites ----
        hs = await pg.evaluate("[HGT['wef']/HGT0['wef'],HGT['gaza_doc']/HGT0['gaza_doc']]")
        chk("pins scale by centrality", hs[0] > 2.7 and abs(hs[1]-1) < 1e-9, str(hs))
        sp = await pg.evaluate("[...document.querySelectorAll('script')].some(x=>x.textContent.includes('slow heartbeat')&&x.textContent.includes('HGT0[host]'))")
        chk("satellites small + slow pulse", sp)

        # ---- camp labels ----
        camp = await pg.evaluate("Object.values(CAMP).reduce((m,v)=>(m[v]=(m[v]||0)+1,m),{})")
        chk("camp 46/15/6", camp.get("Globalist") == 46 and camp.get("Civnat") == 15 and camp.get("Nationalist") == 6, str(camp))
        dock = await pg.text_content("#dock")
        chk("dock Alignment group", "Alignment" in dock and "Nationalist" in dock)
        f = await pg.evaluate("demoFilter={group:'camp',value:'Nationalist'};['robinson','lowe','blair'].map(id=>demoMatch(id))")
        chk("camp filter nationalists only", f == [True,True,False], str(f))
        await pg.evaluate("demoFilter=null")

        # ---- help card ----
        await pg.wait_for_timeout(1200)   # auto-open is at 8.6s; we are past that
        chk("help auto-opens after intro", await pg.evaluate("document.getElementById('help').classList.contains('show')"))
        await pg.evaluate("closeHelp()")
        chk("help card closes", not await pg.evaluate("document.getElementById('help').classList.contains('show')"))
        await pg.evaluate("openHelp()")
        chk("help reopens", await pg.evaluate("document.getElementById('help').classList.contains('show')"))
        await pg.evaluate("closeHelp()")

        # ---- panels ----
        await pg.evaluate("select('mahmood')")
        await pg.wait_for_timeout(500)
        pd = await pg.text_content("#panel")
        chk("mahmood panel: sentencing + hot mic + grooming",
            "Two-tier sentencing" in pd and "Hot-mic" in pd and "rape-gang inquiry" in pd, pd[:100])
        chk("mahmood GLOBALIST chip", "GLOBALIST" in (await pg.text_content("#ptags")))
        await pg.evaluate("select('farage')")
        await pg.wait_for_timeout(400)
        chk("farage CIVNAT chip", "CIVNAT" in (await pg.text_content("#ptags")))
        await pg.evaluate("select('wef')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("wef Brende detail", "Brende" in pd and "resigned" in pd, pd[:80])
        await pg.evaluate("select('mandelson')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("mandelson arrest detail", "arrested" in pd, pd[:80])
        await pg.evaluate("select('epstein')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("epstein panel", "sex" in pd.lower() and "Mandelson" in pd, pd[:80])
        await pg.evaluate("select('tice')")
        await pg.wait_for_timeout(400)
        chk("tice kiss chip", "KISSED THE WALL" in (await pg.text_content("#ptags")))
        kk = await pg.evaluate("('tice' in KISSED) && !('khan' in KISSED)")
        chk("khan has no kiss chip", kk)

        # ---- deep-dive additions (Aug 2026) ----
        await pg.evaluate("select('wallace')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("wallace panel: superinjunction + no apology",
            "superinjunction" in pd and "no apology" in pd, pd[:100])
        chk("wallace GLOBALIST chip", "GLOBALIST" in (await pg.text_content("#ptags")))
        await pg.evaluate("select('afghanleak')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("afghanleak panel: 18,714 + contra mundum",
            "18,714" in pd and "contra mundum" in pd, pd[:100])
        await pg.evaluate("select('tabor')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("tabor fix: son's Global, no GB News claim",
            "Ashley Tabor-King" in pd and "owner of LBC" not in pd and "$60m" not in pd, pd[:100])
        await pg.evaluate("select('gbnews')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("gbnews fix: Discovery/Legatum/Marshall, no Tabor",
            "Discovery" in pd and "Legatum" in pd and "Tabor" not in pd, pd[:100])
        await pg.evaluate("select('johnson')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("johnson deep-dive: 23,000 deaths + Pincher",
            "23,000" in pd and "Pincher" in pd, pd[:100])
        await pg.evaluate("select('vince')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("vince deep-dive: Horizon + Royal Mail",
            "faintest idea" in pd and "Royal Mail" in pd, pd[:100])
        await pg.evaluate("select('musk')")
        await pg.wait_for_timeout(400)
        pd = await pg.text_content("#panel")
        chk("musk deep-dive: fight back or die",
            "fight back or die" in pd and "100m" in pd, pd[:100])

        # ---- perf + errors ----
        fps = await pg.evaluate("""new Promise(res=>{let n=0;const t0=performance.now();
            function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else res(n/2);}
            requestAnimationFrame(f);})""")
        chk("fps >= 25 (swiftshader)", fps >= 25, fps)
        chk("no page errors", len(errs) == 0, errs[:3])

        await b.close()
        print(f"\n{passed}/{passed+failed} passed")
        return failed

sys_code = asyncio.run(main())
raise SystemExit(sys_code)
