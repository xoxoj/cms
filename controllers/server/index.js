'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Content = mongoose.model('Content'),
    Category = mongoose.model('Category'),
    Comment = mongoose.model('Comment'),
    File = mongoose.model('File'),
    Role = mongoose.model('Role'),
    userController = require('./user'),
    config = require('../../config'),
    core = require('../../libs/core');

//后台首页
exports.index = function(req, res) {
    if(req.session.user) {
        var obj = {}
        Content.count().exec().then(function(result) {
            //console.log(result)
            obj.content = result;
            return Category.count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.category = result;
            return Comment.count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.comment = result;
            return User.count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.user = result;
            return Role.count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.role = result;
            return File.count().exec();
        }).then(function(result) {
            obj.file = result;
            console.log(obj);
            res.render('server/index', { title: '管理后台', data: obj});
        });
    } else {
        var path = core.translateAdminDir('/user/login');
        return res.redirect(path);
    }
};
//管理员资料
exports.me = function(req, res) {
    if(!req.session.user) {
        var path = core.translateAdminDir('/user/login');
        return res.redirect(path);
    }
    var id = req.session.user._id;
    User.findById(id).populate('roles').exec(function(err, user) {
        user._roles = req.Roles;
        user._actions = req.Actions;
        res.render('server/me', {
            title: '我的资料',
            user: user
        });
    }); 
};
//修改密码
exports.updatePassword = function(req, res) {
    if(req.method === 'GET') {

    } else if(req.method === 'POST') {
        var obj = req.body;
        var oldPassword = obj.oldpassword;
        var password = obj.password;
        var id = req.session.user._id;
        User.findById(id).exec(function(err, user) {
            if (user.authenticate(oldPassword)) {
                user.password = password;
                user.save(function(err, result) {
                    //console.log('fffffffffffff', result);
                    userController.reload(result._id, function(err, user) {
                        req.session.user = user;
                        res.locals.User = user;
                        res.render('server/info', {
                            message: '密码修改成功'
                        });
                    });
                    /*req.session.user = result;
                    res.locals.User = result;
                    res.render('server/info', {
                        message: '密码修改成功'
                    });*/
                });
            } else {
                res.render('server/info', {
                    message: '原密码不正确'
                });
            }
        });
    }
};

//初始化后台,安装初始数据
exports.install = function(req, res) {
    if(req.session.user) {
        var path = core.translateAdminDir('/index');
        return res.redirect(path);
    }
    //检查是否已经有用户
    User.find({}, function(err, results) {
        console.log(err, results);
        if(err) {
            return;
        }
        if(results.length < 1) {
            //满足条件
            if(req.method === 'GET') {
                res.render('server/install', {
                    title: '初始化'
                });
            } else if(req.method === 'POST') {
                var createUser = function(obj) {
                    var user = new User(obj);
                    user.save(function() {
                        res.render('server/info', {
                            message: '初始化完成'
                        });
                    });
                };
                var obj = req.body;
                obj.status = 101;//系统默认管理员
                //检查是否有角色，没有的话创建
                Role.find({status: 201}, function(err, roles) {
                    console.log('查找role', err, roles)
                    if(roles.length < 1) {
                        console.log('没有角色 ' + config.admin.role.admin);
                        var role = new Role({
                            name: config.admin.role.admin,
                            actions: [],
                            status: 201//系统默认管理员角色
                        });
                        role.save(function(err, result) {
                            console.log('role result', result);
                            obj.roles = [role._id];
                            createUser(obj);
                        });
                        //创建普通角色
                        new Role({
                            name: config.admin.role.user,
                            actions: [],
                            status: 202//系统默认用户角色
                        }).save();
                    }else{
                        obj.roles = [roles[0]._id];
                        createUser(obj);
                    }
                })
            }
        }else{
            //已经初始化过，跳过
            var path = core.translateAdminDir('/index');
            res.redirect(path);
        }
    })
};