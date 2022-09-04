class command {
  constructor() {
    this.start = /^\/start/;
    this.test = /\/test/;
    this.server = /\/disk/;
    this.zip = /\/zip (.+)/
    this.cancel = /\/cancel (.+)/
    // this.magnet = /\/up (.+)/;
    this.setTD = /\/addtd (.+)/
    this.removeTD = /\/rmtd/
    this.magnet = /^(magnet:\?xt.+)|^(https?:\/\/.+)/;
    this.doc = /\/up/;
    this.doczip = /\/zip/;
    this.help = /\/help/;
    this.login = /\/login/;
    this.token = /^[\d]\/(.{55})/;
    this.logout = /\/logout/;
  }
}

module.exports = command;
