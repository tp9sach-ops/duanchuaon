import sys, json, subprocess, time, os
from playwright.sync_api import sync_playwright
import pathlib
HERE=pathlib.Path(__file__).parent
out=sys.argv[1]; js_after=sys.argv[2] if len(sys.argv)>2 else ''
vw=int(os.environ.get('VW',1280)); vh=int(os.environ.get('VH',720)); wait=int(os.environ.get('WAIT',9000))
srv=subprocess.Popen(['python3',str(HERE/'srv.py')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':vw,'height':vh}); logs=[]
    pg.on('console',lambda m:logs.append(m.type+': '+m.text[:200]) if m.type in('error','warning') else None)
    pg.on('requestfailed',lambda r:logs.append('RF '+r.url[:120]))
    pg.on('response',lambda r:logs.append('HTTP %d %s'%(r.status,r.url[:110])) if r.status>=400 else None)
    pg.on('pageerror',lambda e:logs.append('PAGEERR '+str(e)[:300]))
    def route(r):
        u=r.request.url
        if u.startswith('http://localhost'): r.continue_()
        else: r.abort()
    pg.route('**/*',route)
    pg.add_init_script("try{localStorage.setItem('lgt.name','Giang');localStorage.setItem('lgt.color','"+os.environ.get('COLOR','nau')+"')}catch(e){}")
    pg.goto('http://localhost:8093/index.html?debug=1&shadow='+os.environ.get('SH','1024')+'&x=1'+os.environ.get('Q','')); pg.wait_for_timeout(wait)
    if js_after:
        r=pg.evaluate(js_after); print('eval:',r); pg.wait_for_timeout(int(os.environ.get('WAIT2',2500)))
    pg.screenshot(path=out,timeout=180000); print('\n'.join([l for l in logs if 'supabase' not in l and 'ERR_FAILED' not in l and 'script.google' not in l and 'fonts.g' not in l][:25])); b.close()
finally: srv.kill()
