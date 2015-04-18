#!/usr/bin/env python
import requests
import re
from StringIO import StringIO
from PIL import Image
from time import time,sleep

def debug(msg):
    if DEBUG: print msg

def curTime(): return int(time()*1000)

def pollingStatus():
    r = s.get(urlPolling)
    code = re.findall('window\.code=(\d*);',r.content)[0]
    return int(code)


DEBUG = True

useragent = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
             'Content-Type': 'text/plain; charset=utf-8'};
s = requests.Session()
s.headers.update(useragent)

# get uuid
r = s.get('https://login.weixin.qq.com/jslogin?appid=wx782c26e4c19acffb')
uuid = re.findall('"(\w*)";',r.content)[0]
debug("uuid: %s" % uuid)

# get data of QR code image
urlQR = 'https://login.weixin.qq.com/qrcode/%s?t=webwx' % uuid
dataQR = s.get(urlQR).content
img = Image.open(StringIO(dataQR))
debug("image size: %d x %d" % (img.size[0],img.size[1]))
img.show()

# polling till QR scaned and confirmed
urlPolling = "https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?uuid=%s&tip=1&_=%s" % (uuid,curTime())
while 1:
    scanned = False;
    code = pollingStatus();
    if (not scanned) and (code == 201):
        scanned = True;
        print 'QR Code Scanned'
    elif code == 200:
        print 'Login Confirmed'
        break;
    else:
        debug("Not logged in yet, status %d" % code)
        sleep(3);

# redirect and get cookie
print urlPolling
###urlPolling = 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?uuid=2a77fa9075ca43&tip=1&_=1429322554904'
r = s.get(urlPolling)
redir = re.findall('redirect_uri="(.*?)";',r.content)[0]
if redir[:4] != 'http':
    redir = 'https://' + redir
# Convert to wx2 redir
    redir = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?' + redir.split('?')[1]
r = s.get(redir)

print r.cookies['wxuin']
print r.cookies['wxsid']
uin = re.findall('Set-Cookie: wxuin=(\d*);',str(r.headers))[0]
sid = re.findall('Set-Cookie: wxsid=(\w*);',str(r.headers))[0]
debug("uin: %s, sid: %s" % (uin,sid))

# post for successful login and retrieve Skey
urlInit = "https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=%s" % curTime()
json = ('{"BaseRequest":'
                '{"Uin":"' + uin +'",'
                '"Sid":"'+ sid +'",'
                '"Skey":"",'
                '"DeviceID":"e519062714518514"}}')
r = s.post(urlInit,data=json)
print r.content


