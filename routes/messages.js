const express = require("express")
const router = new express.Router()
const Message = require("../models/message")
const {ensureLoggedIn} = require("../middleware/auth")
const ExpressError = require("../expressError")


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async(req,res,next) => {
    try{
        const username = req.user.username
        const message = await Message.get(req.params.id)
        console.log(username)
        console.log(message)
        
        if(message.to_user.username === username || message.from_user.username === username){
            return res.json({message})
        }
        throw new ExpressError("You are not allowed to view this message", 404)

    }catch(e){
        return next(e)
    }
})


/** POST / - post message.
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async(req,res,next) => {
    try{
        const msg = await Message.create({
            from_username: req.user.username,
            to_username: req.body.to_username,
            body: req.body.body
        })
        return res.json({message: msg})
    }catch(e){
        return next(e)
    }
})




/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.get('/:id/read', ensureLoggedIn, async(req,res,next) => {
    try{
        const message = await Message.get(req.params.id)
        const username = req.user.username
        
        if(message.to_user.username !== username){
            throw new ExpressError("you cannor mark this message as read", 404)
        }

        const msg = await Message.markRead(req.params.id)
        return res.json({msg})
    }catch(e){
        return next(e)
    }
})

module.exports = router

