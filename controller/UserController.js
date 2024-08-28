var User = require('../models/User')

exports.findOrCreate = async (userObj) => {
    try {

        var user = await User.findOne({
            chat_id: userObj.id
        })
        if (!user) {
            user = await User.create({
                first_name: userObj.first_name,
                last_name: userObj.last_name,
                username: userObj.username,
                chat_id: userObj.id,
            })
            return user;
        }
        return user;
    } catch (e) {
        console.log(e)
        return null;
    }

}