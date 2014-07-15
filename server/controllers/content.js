'use strict';
var mongoose = require('mongoose'),
    Content = mongoose.model('Content'),
    Category = mongoose.model('Category'),
    _ = require('underscore'),
    core = require('../../libs/core');

//列表
exports.list = function(req, res) {
    var condition = {};
    var category = req.query.category;
    if(category) {
        condition.category = category;
    }
    if(req.Roles && req.Roles.indexOf('admin') < 0) {
        condition.author = req.session.user._id;
    }
    //查数据总数
    Content.count(condition, function(err, total) {
        var query = Content.find(condition).populate('author', 'username name email');
        //分页
        var pageInfo = core.createPage(req, total, 10);
        //console.log(pageInfo);
        query.skip(pageInfo.start);
        query.limit(pageInfo.pageSize);
        query.sort({created: -1});
        query.exec(function(err, results) {
            //console.log(err, results);
            res.render('server/content/list', {
                title: '内容列表',
                contents: results,
                pageInfo: pageInfo,
                Menu: 'list'
            });
        });
    });
    
};
//单条
exports.one = function(req, res) {
    var id = req.param('id');
    var nested = req.query.comment_list;
    Content.findById(id).populate('author').populate('category').populate('comments').populate('gallery').exec(function(err, result) {
        console.log(result);
        if(!result) {
            return res.render('server/message', {
                message: '该内容不存在'
            });
        }
        result.visits = result.visits + 1;
        result.save();
        res.render('server/content/item', {
            title: result.title,
            content: result,
            comment_list: nested
        });
    });
};
//添加
exports.add = function(req, res) {
    if (req.method === 'GET') {
        var condition = {};
        if(req.Roles && req.Roles.indexOf('admin') < 0) {
            condition.author = req.session.user._id;
        }
        Category.find(condition, function(err, results) {
            res.render('server/content/add', {
                categorys: results,
                Menu: 'add'
            });
        });
    } else if (req.method === 'POST') {
        var obj = req.body;
        if (req.session.user) {
            obj.author = req.session.user._id;
        }
        if(obj.category === '') {
            obj.category = null;
        }
        var content = new Content(obj);
        content.save(function(err, content) {
            if (err) {
                console.log(err);
                return res.render('server/message', {
                    message: '创建失败'
                });
            }
            res.render('server/message', {
                message: '创建成功'
            });
        });
    }
};
exports.edit = function(req, res) {
    if(req.method === 'GET') {
        var id = req.param('id');
        Content.findById(id).populate('author').populate('gallery').exec(function(err, result) {
            if(err) {
                console.log('加载内容失败');
            }
            if(req.Roles && req.Roles.indexOf('admin') === -1 && result.author && (result.author._id + '') !== req.session.user._id) {
                return res.render('server/message', {
                    message: '没有权限'
                });
            }
            var condition = {};
            if(req.Roles && req.Roles.indexOf('admin') < 0) {
                condition.author = req.session.user._id;
            }
            Category.find(condition, function(err, categorys) {
                res.render('server/content/edit', {
                    content: result,
                    categorys: categorys
                });
            });
        });
    } else if(req.method === 'POST') {
        var id = req.param('id');
        var obj = req.body;
        console.log(obj);
        console.log(obj.gallery)
        if(obj.category === '') {
            obj.category = null;
        }
        if(!obj.gallery) {
            obj.gallery = [];
        }
        
        Content.findById(id).populate('author').exec(function(err, result) {
            //console.log(result);
            if(req.Roles && req.Roles.indexOf('admin') === -1 && result.author && (result.author._id + '') !== req.session.user._id) {
                return res.render('server/message', {
                    message: '没有权限'
                });
            }
            _.extend(result, obj);
            result.save(function(err, content) {
                if(err || !content) {
                    return res.render('server/message', {
                        message: '修改失败'
                    });
                }
                res.render('server/message', {
                    message: '更新成功'
                });
            });
        });
    }
};
//删除
exports.del = function(req, res) {
    var id = req.params.id;
    Content.findById(id).populate('author').exec(function(err, result) {
        if(err || !result) {
            return res.render('server/message', {
                message: '内容不存在'
            });
        }
        if(req.Roles && req.Roles.indexOf('admin') === -1 && result.author && (result.author._id + '') !== req.session.user._id) {
            return res.render('server/message', {
                message: '没有权限'
            });
        }
        //
        result.remove(function(err) {
            if(err) {
                return res.render('server/message', {
                    message: '删除失败'
                });
            }
            res.render('server/message', {
                message: '删除成功'
            })
        });
    });
};