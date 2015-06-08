#!/usr/bin/env python
import requests
import re
import json
from StringIO import StringIO
from PIL import Image
from time import time,sleep

def debug(msg):
    if DEBUG: print msg

def log(msg):
    with open('wxb.log','a') as f:
        f.write('\n'+'+'*30+'\n')
        f.write(msg)
        f.write('\n'+'-'*30+'\n')
        f.close()

def curTime(): return int(time()*1000)

def pollingStatus():
    r = s.get(urlPolling)
    code = re.findall('window\.code=(\d*);',r.content)[0]
    return int(code)

#set debug flag
DEBUG = True

#set user-agent
useragent = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
             'Content-Type': 'text/plain; charset=utf-8'};

#set up request session
s = requests.Session()
s.headers.update(useragent)


'''-------------Login Process---------------'''
debug("[+]Fetching uuid")
r = s.get('https://login.weixin.qq.com/jslogin?appid=wx782c26e4c19acffb')
uuid = re.findall('"(\w*)";',r.content)[0]
debug("[-]uuid: %s\n" % uuid)

# get data of QR code image
debug("[+]Fetching QR")
urlQR = 'https://login.weixin.qq.com/qrcode/%s?t=webwx' % uuid
dataQR = s.get(urlQR).content
img = Image.open(StringIO(dataQR))
img.show()
debug("[-]Image size: %d x %d\n" % (img.size[0],img.size[1]))

# polling till QR scaned and confirmed
debug("[+]QR-scan polling")
urlPolling = "https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?uuid=%s&tip=1&_=%s" % (uuid,curTime())
while 1:
    scanned = False;
    code = pollingStatus();
    if (not scanned) and (code == 201):
        scanned = True
        debug('[.]QR Code Scanned')
    elif code == 200:
        debug('[-]Login Confirmed\n')
        break
    else:
        debug("[!]Not logged in yet, status %d" % code)
    sleep(2)

# redirect and get cookie
debug("[+]Redirecting")
###urlPolling = 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?uuid=9f027f49437546&tip=1&_=1429322554904'
r = s.get(urlPolling)
redir = re.findall('redirect_uri="(.*?)";',r.content)[0]
if redir[:4] != 'http':
    # Convert to wx2 redir
    redir = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?' + redir.split('?')[1]
r = s.get(redir,allow_redirects=False)
debug("[-]Redirected to: %s\n" % redir)

# parse uid sid Skey
debug("[+]Parsing cookies")
uin = r.cookies['wxuin']
sid = r.cookies['wxsid']
ticket = r.cookies['webwx_data_ticket'];
skey = re.findall('<skey>(.*?)</skey>',r.content)[0]
debug("[.]uin: %s, sid: %s, ticket: %s\n[-]skey: %s\n" % (uin,sid,ticket,skey))

# post for successful login
debug("[+]Init: Fetch key 1,2,3")
urlInit = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=%s" % curTime()
data_js = ('{"BaseRequest":'
                '{"Uin":"' + uin +'",'
                '"Sid":"'+ sid +'",'
                '"Skey":"",'
                '"DeviceID":"e519062714518514"}}')
r = s.post(urlInit,data=data_js)
#log(r.content)
jsdata = json.loads(r.content)
key1,key2,key3,key1000 = [keys['Val'] for keys in jsdata['SyncKey']['List']]
debug("[-]Key1: %s, Key2: %s, Key3: %s, Key1000: %s\n" % (key1,key2,key3,key1000))

# update msg list
debug("[+]Fetch message update list")
cTime = curTime()
url = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsync?sid=%s&r=%s' % (sid,cTime)
data_js = ('{"BaseRequest":{'
                '"Uin":%s,'
                '"Sid":"%s"},'
            '"SyncKey":{'
                '"Count":4,'
                '"List":['
                    '{"Key":1,"Val":%s},'
                    '{"Key":2,"Val":%s},'
                    '{"Key":3,"Val":%s},'
                    '{"Key":1000,"Val":%s}]},'
            '"rr":%s}') % (uin,sid,key1,key2,key3,key1000,cTime)
r = s.post(url,data=data_js)
log(r.content)
debug("[-]\n")

# fetch contact list
debug("[+]Fetching contact list")
urlContact = "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?r=%s" % curTime()
data_js = ('{}')
r = s.post(urlContact,data=data_js)
jsdata = json.loads(r.content)
log(r.content)
debug("[-]Retrieved %s contact" % jsdata['MemberCount'])
