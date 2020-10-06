var nJwt = require('njwt');
var secureRandom = require('secure-random');
var signingKey = secureRandom(256, { type: 'Buffer' }); // Create a highly random byte array of 256 bytes

var claims = {
    iss: "easylaundry.softcept.com",  // The URL of your service
    sub: "users/user1234",    // The UID of the user in your system
    scope: "self, admins"
}
module.exports = {

    createToken: function () {

        var jwt = nJwt.create(claims, signingKey);
        jwt.setExpiration(new Date().getTime() + 60 * 1000)
        return jwt
    },

    verifyToken: function (req, res, token) {

        if (token) {

            try {
                verifiedJwt = nJwt.verify(token, signingKey);
                return true
            } catch (e) {
                return false
            }

        }
    }
}

