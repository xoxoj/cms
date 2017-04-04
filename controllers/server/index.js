'use strict';

let  mongoose = require('mongoose')
let User = mongoose.model('User')
let Content = mongoose.model('Content')
let Category = mongoose.model('Category')
let Comment = mongoose.model('Comment')
let File = mongoose.model('File')
let Role = mongoose.model('Role')
let userController = require('./user')
let config = require('../../config')
let core = require('../../libs/core')

//后台首页
exports.index = function(req, res) {
    if(req.session.user) {
        let obj = {}
        let filter = {};
        if(req.Roles && req.Roles.indexOf('admin') < 0) {
            filter = {author: req.session.user._id};
        }
        Content.find(filter).count().exec().then(function(result) {
            //console.log(result)
            obj.content = result;
            return Category.find(filter).count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.category = result;
            return Comment.find(filter).count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.comment = result;
            return User.find(filter).count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.user = result;
            return Role.find(filter).count().exec();
        }).then(function(result) {
            //console.log(result);
            obj.role = result;
            return File.find(filter).count().exec();
        }).then(function(result) {
            obj.file = result;
            console.log(obj);
            res.render('server/index', { title: '管理后台', data: obj});
        });
    } else {
        let path = core.translateAdminDir('/user/login');
        return res.redirect(path);
    }
};

//初始化后台,安装初始数据
exports.install = function(req, res) {
    if(req.session.user) {
        let path = core.translateAdminDir('');
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
                let createUser = function(obj) {
                    let user = new User(obj);
                    user.save(function() {
                        res.render('server/info', {
                            message: '初始化完成'
                        });
                    });
                };
                let obj = req.body;
                obj.status = 101;//系统默认管理员
                //检查是否有角色，没有的话创建
                Role.find({status: 201}, function(err, roles) {
                    console.log('查找role', err, roles)
                    if(roles.length < 1) {
                        console.log('没有角色 ' + config.admin.role.admin);
                        let role = new Role({
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
            let path = core.translateAdminDir('');
            res.redirect(path);
        }
    })
};