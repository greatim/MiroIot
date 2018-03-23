/// <reference path="./node_modules/@types/bootstrap/index.d.ts" />
/// <reference path="./node_modules/@types/bootstrap-treeview/index.d.ts" />
/// <reference path="./local.d.ts" />
var srAngularApp = angular
    .module("srAngular", ["ngRoute"])
    .config(function ($routeProvider, $iot) {
    $routeProvider
        .when("/entranceGuardSystem", {
        templateUrl: "views/entranceGuardSystem.html?" + $iot.startTime,
        resolve: {
            auth: function ($q, $rootScope) {
                var auth = $rootScope.isAuthorize;
                if (auth) {
                    return $q.when(auth);
                }
                else {
                    return $q.reject({
                        authenticated: false
                    });
                }
            }
        }
    })
        .when("/querySystem", {
        templateUrl: "views/querySystem.html?" + $iot.startTime,
        resolve: {
            auth: function ($q, $rootScope) {
                var auth = $rootScope.isAuthorize;
                if (auth) {
                    return $q.when(auth);
                }
                else {
                    return $q.reject({
                        authenticated: false
                    });
                }
            }
        }
    })
        .when("/advertisingSystem", {
        templateUrl: "views/advertisingSystem.html?" + $iot.startTime,
        resolve: {
            auth: function ($q, $rootScope) {
                var auth = $rootScope.isAuthorize;
                if (auth) {
                    return $q.when(auth);
                }
                else {
                    return $q.reject({
                        authenticated: false
                    });
                }
            }
        }
    })
        .otherwise({
        templateUrl: "views/Login.html?" + $iot.startTime
    });
})
    .run(function ($rootScope, $location, $iot) {
    $rootScope.isAuthorize = false;
    $rootScope.$on("$routeChangeStart", function () {
        if (!$rootScope.isAuthorize) {
            $location.path("/");
        }
    });
    //当前操作小区
    $rootScope.currentCommunity = false;
    //关闭广告功能 默认打开
    $rootScope.openAdsystem = $iot.advertisingMode;
    try {
        $iot
            .connect()
            .bindOpen(function () { return (document.title = $iot.title + " - 连接服务器成功"); })
            .bindClose(function () {
            document.title = $iot.title + " - 与服务器断开连接";
            alert("连接已断开，请重新登录！");
            location.reload();
        })
            .bindError(function () { return alert($iot.title + "通信发生错误"); })
            .bindClearEvents(function () {
            $rootScope.$apply(function () {
                $rootScope.events = [];
                $rootScope.recordBarData = true;
                $rootScope.listQuery = true;
            });
        })
            .bindEvent(function (item) { return $rootScope.events.push(item); })
            .bindEventsCompleted(function () {
            $rootScope.$apply(function () {
                $rootScope.recordBarData = false;
            });
        })
            .bindClearLogs(function () {
            $rootScope.$apply(function () {
                $rootScope.Status = [];
                $rootScope.logsbarData = true;
                $rootScope.listStatus = true;
            });
        })
            .bindLog(function (item) { return $rootScope.Status.push(item); })
            .bindLogsCompleted(function () {
            $rootScope.$apply(function () {
                $rootScope.logsbarData = false;
            });
        });
    }
    catch (err) {
        if (typeof err === "string")
            document.getElementById("message_output").innerHTML = err;
    }
})
    .filter("roomName", function ($iot) { return function (input) {
    var id = $iot.current.id;
    var x = $iot.communities.flatten(id, input);
    return !x ? input : x.block.name + x.unit.name + x.flat.id;
}; })
    .filter("roomToAddressid", function ($iot) { return function (input) {
    var id = $iot.current.id;
    var x = $iot.communities.flatten(id, input);
    return x.block.id + x.unit.id + x.flat.id;
}; })
    .filter("nricFilter", function () { return function (nric) { return (nric.length > 18 ? "" : nric); }; })
    .filter("deviceAddress", function () { return Helper.deviceAddressToStr; })
    .filter("nricToname", function () { return function (id, people) {
    if (!id) {
        return "";
    }
    var x = people.$[id];
    return x ? x.name : "";
}; })
    .filter("nricTorooms", function () { return function (id, people) {
    if (!id) {
        return [];
    }
    var x = people.$[id];
    return x ? x.rooms : [];
}; })
    .filter("deviceToAddress", function () { return function (device, deviceList) {
    var item = deviceList.$[device];
    return item ? item.address : undefined;
}; })
    .filter("cardidTonumber", function () { return function (id, number) {
    for (var i = 0; i < number.length; i++) {
        if (number[i].id === id) {
            return number[i].serial;
        }
    }
}; })
    .filter("bindingroomToaddress", function ($iot) { return function (room) {
    if (!room || room.length !== 10)
        return "";
    var blockId = room.slice(0, 4);
    var block = $iot.current.arch.communityX.items.$[blockId];
    var unitId = room.slice(4, 6);
    var unit = block.items.$[unitId];
    var roomId = room.slice(6);
    return block.name + unit.name + roomId;
}; })
    .filter("fingerFilter", function () { return function (finger) { return (finger ? Helper.fingerConstans[finger - 1].name : ""); }; })
    .filter("Filter_level", function () { return function (level) { return level & 63; }; })
    .filter("fingerprintToName", function ($filter) { return function (id, fingerprintList, personelList, fingers) {
    var _loop_1 = function (i) {
        if (fingerprintList[i].id === id) {
            var fingerName = fingers.filter(function (t) { return t.id === fingerprintList[i].finger; });
            return { value: $filter("nricToname")(fingerprintList[i].nric, personelList) + "的" + fingerName[0].name };
        }
    };
    for (var i = 0; i < fingerprintList.length; i++) {
        var state_1 = _loop_1(i);
        if (typeof state_1 === "object")
            return state_1.value;
    }
}; })
    .filter("personFilter", function ($filter) { return function (viewData, filter) {
    if (!filter) {
        return viewData.personnel.copy.$;
    }
    var roomPredicate = function (room) { return $filter("roomName")(room).indexOf(filter) !== -1 || $filter("roomToAddressid")(room).indexOf(filter) !== -1; };
    var predicate = function (item) {
        for (var prop in item) {
            if (item.hasOwnProperty(prop)) {
                if (prop === "rooms" && item[prop].some(roomPredicate)) {
                    return true;
                }
                else if (item[prop].toString().indexOf(filter) !== -1) {
                    return true;
                }
            }
        }
        return false;
    };
    return viewData.personnel.filter(predicate).$;
}; })
    .filter("unAuthDevice_filter", function () { return function (deviceList, str) {
    var num = Number(str);
    if (isNaN(num) || !num) {
        return deviceList.$;
    }
    var zip = String(num);
    return deviceList.filter(function (item) { return item.address.toString().slice(0, zip.length) === zip; }).$;
}; })
    .filter("dateFilter", function () { return function (time) {
    var padding = function (num) { return ("0" + num).slice(-2); };
    var date = new Date(time * 1000);
    var year = date.getFullYear();
    var month = padding(date.getMonth() + 1);
    var day = padding(date.getDate());
    var hour = padding(date.getHours());
    var minute = padding(date.getMinutes());
    var second = padding(date.getSeconds());
    return year + "/" + month + "/" + day + "  " + hour + ":" + minute + ":" + second;
}; })
    .controller("mainCtrl", function ($scope, $timeout, $rootScope, $location, $filter, $fp, $iot) {
    /*动态样式*/
    //主导航
    var urlChoose;
    $scope.chooseUrl = function (num) {
        $rootScope.currentCommunity = num === 1;
        urlChoose = num;
    };
    $scope.Urlstyle = function (num) { return (num === urlChoose ? "active" : ""); };
    //侧边管理导航
    var sideUrlChoose;
    $scope.entrancesidebarStyle = function (num) { return (num === sideUrlChoose ? "active" : ""); };
    //侧边查询导航
    var sideUrlChooseQuery;
    $scope.querysidebarStyle = function (num) { return (num === sideUrlChooseQuery ? "active" : ""); };
    //侧边广告导航
    var sideUrlChooseAdvertising;
    $scope.advertisingsidebarStyle = function (num) { return (num === sideUrlChooseAdvertising ? "active" : ""); };
    //帐号管理路径导航
    $scope.accountUrl = function (num) { return ($scope.viewSwitch.mode === num ? "active" : ""); };
    /*动态样式*/
    $scope.hideGuardSystem = false;
    $scope.hideAdSystem = false;
    $scope.hideAdFileManage = true;
    $scope.hideAdLaunch = true;
    $scope.userGradeList = Helper.adminConstans.slice(0);
    //小区操作
    $scope.showOperateCom = true;
    //注册登录
    $scope.GradeValue = "";
    $scope.chooseAdPowerView = function (newVal) {
        var parsePower = function () {
            if ($rootScope.openAdsystem) {
                if ($scope.adminData.level === 0 && Number(newVal) === 1) {
                    return [true, false];
                }
                if ($scope.adminData.level === 0 || !!($scope.adminData.level & 256)) {
                    return [false, true];
                }
            }
            return [false, false];
        };
        _a = parsePower(), $scope.chooseAdPower_1 = _a[0], $scope.chooseAdPower_2 = _a[1];
        var _a;
    };
    var orderBy = $filter("orderBy");
    $scope.Login_register = true;
    $scope.login = function (user, psw, rmm) {
        $scope.hideGuardSystem = false;
        $scope.hideAdSystem = false;
        $scope.hideAdFileManage = true;
        $scope.hideAdLaunch = true;
        $iot.accounts
            .login(user, psw, rmm)
            .then(function (data) {
            $rootScope.isAuthorize = true;
            $timeout(function () {
                $scope.chooseNumber = 5;
                $scope.adminData.communities = data.communities;
                $scope.adminData.name = data.name;
                $scope.adminData.level = data.level;
                //超级管理员
                if (data.level === 0) {
                    $location.path("/entranceGuardSystem");
                    urlChoose = 1;
                    $scope.hideAdSystem = $rootScope.openAdsystem;
                    $scope.hideAdLaunch = false;
                    $scope.hideAdFileManage = false;
                    $scope.showOperateCom = true;
                    $scope.userGradeList = Helper.adminConstans.slice(0);
                    return;
                }
                //一级管理员
                if ((data.level & 63) === 1) {
                    $scope.showOperateCom = true;
                    $scope.userGradeList = Helper.adminConstans.slice(1);
                    if ((data.level & 256) !== 0) {
                        $location.path("/entranceGuardSystem");
                        urlChoose = 1;
                        $scope.hideAdSystem = $rootScope.openAdsystem;
                        $scope.hideAdLaunch = false;
                        $scope.hideAdFileManage = false;
                        return;
                    }
                    else {
                        $location.path("/entranceGuardSystem");
                        urlChoose = 1;
                        $scope.hideAdSystem = false;
                        $scope.hideAdLaunch = true;
                        $scope.hideAdFileManage = true;
                        return;
                    }
                }
                //二级管理员
                if ((data.level & 63) === 2) {
                    $scope.showOperateCom = false;
                    $scope.userGradeList = Helper.adminConstans.slice(2);
                    if ((data.level & 64) !== 0 && (data.level & 128) !== 0) {
                        $scope.hideAdSystem = $rootScope.openAdsystem;
                        $scope.hideAdLaunch = false;
                        $scope.hideAdFileManage = false;
                        $location.path("/entranceGuardSystem");
                        urlChoose = 1;
                        return;
                    }
                    if ((data.level & 64) !== 0) {
                        $scope.hideAdSystem = $rootScope.openAdsystem;
                        $scope.hideAdFileManage = false;
                        $scope.hideAdLaunch = true;
                        $location.path("/entranceGuardSystem");
                        urlChoose = 1;
                        return;
                    }
                    if ((data.level & 128) !== 0) {
                        $scope.hideAdSystem = $rootScope.openAdsystem;
                        $scope.hideAdFileManage = true;
                        $scope.hideAdLaunch = false;
                        $location.path("/entranceGuardSystem");
                        urlChoose = 1;
                        return;
                    }
                    $location.path("/entranceGuardSystem");
                    urlChoose = 1;
                }
                //三级管理员
                if ((data.level & 63) === 3) {
                    $scope.userGradeList = [];
                    $scope.hideGuardSystem = true;
                    if ((data.level & 64) !== 0 && (data.level & 128) !== 0) {
                        $scope.hideAdSystem = $rootScope.openAdsystem;
                        $scope.hideAdLaunch = false;
                        $scope.hideAdFileManage = false;
                        $location.path("/querySystem");
                        urlChoose = 2;
                        return;
                    }
                    if ((data.level & 64) !== 0) {
                        $scope.hideAdSystem = $rootScope.openAdsystem;
                        $scope.hideAdFileManage = false;
                        $scope.hideAdLaunch = true;
                        $location.path("/querySystem");
                        urlChoose = 2;
                        return;
                    }
                    if ((data.level & 128) !== 0) {
                        $scope.hideAdSystem = $rootScope.openAdsystem;
                        $scope.hideAdFileManage = true;
                        $scope.hideAdLaunch = false;
                        $location.path("/querySystem");
                        urlChoose = 2;
                        return;
                    }
                    $location.path("/querySystem");
                    urlChoose = 2;
                }
            });
        })
            .catch(function () {
            $("#errorText").removeClass("hidden");
            $timeout(function () {
                $("#errorText").addClass("hidden");
            }, 3000);
        });
    };
    $scope.changeLogin = function () {
        $scope.Login_register = !$scope.Login_register;
        $("#errorText").text("");
    };
    $scope.registerActive = function (user, pwd, code) {
        if (user && pwd && code) {
            $iot.accounts
                .register(user, pwd, code)
                .then(function (data) {
                if (data.result) {
                    $(".badge").text("");
                    alert("注册成功");
                }
                else {
                    var errText = data.errors.map(function (x) { return x.description; }).join("\n");
                    $(".badge").text(errText);
                }
            })
                .catch(function (err) { return console.log(err); });
        }
        else {
            alert("请填写完所有数据！");
        }
    };
    /*注册登录结束*/
    /*门禁模块视图切换开始*/
    $scope.chooseView = function (viewNumber) {
        switch (viewNumber) {
            case 1:
                sideUrlChoose = 1;
                $scope.chooseNumber = 1;
                return;
            case 2:
                sideUrlChoose = 2;
                $scope.chooseNumber = 2;
                return;
            case 3:
                sideUrlChoose = 3;
                $scope.chooseNumber = 3;
                $scope.selectedFingerprint = [];
                $scope.authCompleteinfo = [];
                return;
            case 4:
                sideUrlChoose = 4;
                $scope.selectedCard = [];
                $scope.chooseNumber = 4;
                $scope.authCompleteinfo = [];
                return;
            case 5:
                sideUrlChoose = 5;
                $scope.addTree = true;
                $scope.chooseNumber = 5;
                return;
            case 6:
                sideUrlChoose = 6;
                $scope.chooseNumber = 6;
                return;
            default:
                sideUrlChoose = 5;
        }
    };
    $scope.functionalView = function () {
        switch ($scope.chooseNumber) {
            case 1:
                return "views/entranceGuardView/deviceManagement.html?" + $iot.startTime;
            case 2:
                return "views/entranceGuardView/PersonnelManagement.html?" + $iot.startTime;
            case 3:
                $("#addFinger").modal({
                    keyboard: false,
                    backdrop: "static",
                    show: false
                });
                return "views/entranceGuardView/fingerprintManagement.html?" + $iot.startTime;
            case 4:
                return "views/entranceGuardView/cardManagement.html?" + $iot.startTime;
            case 5:
                sideUrlChoose = 5;
                return "views/entranceGuardView/CommunityStructure.html?" + $iot.startTime;
            case 6:
                return "views/entranceGuardView/accountManagement.html?" + $iot.startTime;
            default:
                return "views/entranceGuardView/CommunityStructure.html?" + $iot.startTime;
        }
    };
    $scope.asideView = true;
    /*门禁模块视图切换结束*/
    /*账号管理数据*/
    $scope.adminData = new AdminView();
    /*进入账号管理时获取当前管理员管理的人员数据*/
    $scope.getAdminList = function () {
        $iot.accounts.getSubAdmins().then(function (data) {
            $timeout(function () {
                $scope.adminData.manager = data;
            });
        });
    };
    /*管理界面视图切换开始*/
    $scope.adminViewList = [{ control: 0, name: "小区列表" }, { control: 1, name: "管理员列表" }, { control: 2, name: "生成邀请码" }, { control: 3, name: "修改密码" }];
    $scope.viewSwitch = { mode: 0 };
    $scope.switchView = function (control) {
        $scope.viewSwitch.mode = control;
    };
    /*管理界面视图切换结束*/
    //修改小区
    var editCommunityData;
    $scope.openEditCommunity = function (community) {
        editCommunityData = community;
        $("#editCommunity").modal("show");
        $scope.newCommunityName = community.name;
        $scope.newCommunityRemark = community.remark;
    };
    $scope.editCommunity = function (name, remark) {
        if (!name) {
            alert("请填写名称");
            return;
        }
        $iot.communities
            .modify(editCommunityData.id, name, remark)
            .then(function (data) {
            if (data) {
                alert("修改成功！");
                $timeout(function () {
                    editCommunityData.name = name;
                    editCommunityData.remark = remark;
                });
            }
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    function mapToArray(elements, method) {
        return Helper.getSeq(elements)
            .map(method)
            .toArray();
    }
    /*删除小区开始*/
    $scope.deleteCommunity = function () {
        var deleteCommunityList = angular.element("input:checkbox[name='chooseDeleteCommunity']:checked");
        var sure = confirm("你确定删除这" + deleteCommunityList.length + "个小区吗？");
        if (!sure) {
            return;
        }
        var deleteCommunityIdList = mapToArray(deleteCommunityList, function (item) { return angular.fromJson(item.value).id; });
        $iot.communities
            .delete(deleteCommunityIdList)
            .then(function () {
            $timeout(function () {
                $scope.adminData.communities = $scope.adminData.communities.filter(function (item) { return deleteCommunityIdList.indexOf(item.id) === -1; });
            });
            alert("删除成功！");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*删除小区结束*/
    /*新建小区开始*/
    $scope.createNewCommunity = function (area, newCommunityName, newCommunityRemark) {
        if (!area || !newCommunityName || !newCommunityRemark) {
            alert("请填写完所有信息");
            return;
        }
        $iot.communities
            .create(area, newCommunityName, newCommunityRemark)
            .then(function (data) {
            var newCommunityObj = {
                id: data,
                name: newCommunityName
            };
            $timeout(function () {
                $scope.adminData.communities.unshift(newCommunityObj);
            });
            alert("添加成功！");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*新建小区结束*/
    /*删除管理员开始*/
    $scope.deleteAdmin = function () {
        var deleteAdminList = angular.element("input:checkbox[name='managerChoose']:checked");
        var sure = confirm("你确定删除这" + deleteAdminList.length + "个管理员吗？");
        if (!sure) {
            return;
        }
        var deletaAdminOpenidList = mapToArray(deleteAdminList, function (x) { return x.value; });
        $iot.accounts
            .deleteAdmins(deletaAdminOpenidList)
            .then(function () {
            $timeout(function () {
                $scope.adminData.manager = $scope.adminData.manager.filter(function (item) { return deletaAdminOpenidList.indexOf(item.openid) === -1; });
            });
            alert("删除成功！");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*删除管理员结束*/
    /*编辑管理员开始*/
    var editedManagerOpenid;
    $scope.editAdmin = function (manager, index) {
        console.log(manager.communities);
        $("#editAdmin").modal("show");
        editedManagerOpenid = manager.openid;
        $scope.editedAdmin = manager.name ? manager.name : manager.openid;
        //已授权小区列表
        $scope.editedAdminCommunities = Helper.arrToDic(manager.communities);
        //未授权小区列表
        if ($scope.editedAdminCommunities.length === 0) {
            $scope.uneditedAdminCommunities = Helper.arrToDic(manager.communities);
        }
        else {
            $scope.uneditedAdminCommunities = Seq.ofArray($scope.adminData.communities)
                .filter(function (x) { return !$scope.editedAdminCommunities.containKey(x.id); })
                .toDict(function (x) { return x.id; });
        }
    };
    //授权小区
    $scope.authCommunity = function () {
        var authCommunityList = angular.element("input:checkbox[name='unAuthorizedCommunity']:checked");
        if (authCommunityList.length === 0) {
            alert("请选择小区！");
            return;
        }
        var sure = confirm("你确定授权这" + authCommunityList.length + "个小区给该管理员吗？");
        if (!sure) {
            return;
        }
        var authCommunityIdList = mapToArray(authCommunityList, function (x) { return x.value; });
        $iot.accounts
            .authCommunities(editedManagerOpenid, authCommunityIdList)
            .then(function () {
            $timeout(function () {
                var addition = authCommunityIdList.map($scope.uneditedAdminCommunities.tryRemoveKey).filter(function (x) { return !!x; });
                $scope.editedAdminCommunities.tryAddHead(addition);
                $scope.adminData.manager.$[editedManagerOpenid].communities = $scope.editedAdminCommunities.toArray();
            });
            alert("授权成功！");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    //删除授权
    $scope.unAuthCommunity = function () {
        var unauthCommunityList = angular.element("input:checkbox[name='AuthorizedCommunity']:checked");
        if (unauthCommunityList.length === 0) {
            alert("请选择小区！");
            return;
        }
        var sure = confirm("你确定删除该管理员这" + unauthCommunityList.length + "个小区的授权吗？");
        if (!sure) {
            return;
        }
        var unauthCommunityIdList = mapToArray(unauthCommunityList, function (x) { return x.value; });
        $iot.accounts
            .unAuthCommunities(editedManagerOpenid, unauthCommunityIdList)
            .then(function () {
            $timeout(function () {
                var addtion = unauthCommunityIdList.map($scope.editedAdminCommunities.tryRemoveKey).filter(function (x) { return !!x; });
                $scope.uneditedAdminCommunities.tryAddHead(addtion);
                $scope.adminData.manager.$[editedManagerOpenid].communities = $scope.editedAdminCommunities.toArray();
            });
            alert("删除成功！");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*编辑管理员结束*/
    /*生成邀请码开始*/
    //授权小区下拉
    $scope.authList = true;
    $scope.showList = function () {
        $scope.authList = !$scope.authList;
    };
    $scope.generateInviteCode = function (remark) {
        if (!remark) {
            alert("请填写备注，以识别你申请的邀请码!");
            return;
        }
        var adPower = angular.element("input:checkbox[name='adPower']:checked");
        var grade = Number($("#userGrade").val());
        var level = Helper.getSeq(adPower).fold(grade, function (s, x) { return Number(x.value) | s; });
        var inputEle = angular.element("input:checkbox[name='auth']:checked");
        var authCommunities = mapToArray(inputEle, function (x) { return ({ id: x.value }); });
        $iot.accounts
            .newInviteCode(level, authCommunities, remark)
            .then(function (data) {
            $("#generate").val(data);
            $timeout(function () {
                $scope.adminData.manager.addOrUpdate({
                    level: level,
                    openid: data,
                    remark: remark
                });
            });
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*生成邀请码结束*/
    /*修改密码开始*/
    $scope.changepwd = function (oldPwd, newPwd) {
        if (!oldPwd || !newPwd) {
            alert("请填写旧密码或者新密码！");
            return;
        }
        $iot.manage
            .changePassword(oldPwd, newPwd)
            .then(function (data) {
            alert("密码修改成功");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*修改密码结束*/
    $scope.communityData = new MainView();
    /*小区结构开始*/
    var treeData = [];
    var treeComData; //小区数据
    var blockData; //楼数据
    var unitData; //单元数据
    var roomData; //房间数据
    $scope.addTree = true;
    $scope.closeaddTree = function () {
        $scope.addTree = true;
    };
    $scope.ComStrViewSwitch = {};
    $scope.drawTree = function () {
        if (sideUrlChoose !== 5) {
            return;
        }
        if (treeData.length !== 0) {
            $("#tree").treeview({
                data: treeData,
                levels: 3,
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
                $scope.addTree = false;
            });
        }
    };
    $scope.SendArch = function (com) {
        if (!com.id) {
            return;
        }
        $rootScope.currentCommunity = true;
        //请求小区结构数据
        $scope.asideView = false;
        $iot.communities.loadArch(com.id).then(function (data) {
            $timeout(function () {
                $scope.communityData.address = data;
                $scope.addTree = true;
            });
            if (!data.guid) {
                treeData = [
                    {
                        text: com.name,
                        id: "0",
                        guid: com.id,
                        nodes: []
                    }
                ];
                $("#tree").treeview({
                    data: treeData,
                    levels: 2,
                    multiSelect: false //多
                });
                $("#tree").on("nodeSelected", function (event, data) {
                    switch (data.id) {
                        case "0":
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "0";
                            });
                            treeComData = data;
                            break;
                        case "1":
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "1";
                            });
                            blockData = data;
                            break;
                        case "2":
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "2";
                            });
                            unitData = data;
                            break;
                        case "3":
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "3";
                            });
                            roomData = data;
                            break;
                    }
                    $scope.addTree = false;
                });
            }
            else {
                treeData = Helper.toTreeItem(data);
                $("#tree").treeview({
                    data: treeData,
                    levels: 3,
                    multiSelect: false //多
                });
                $("#tree").on("nodeSelected", function (event, data) {
                    switch (data.id) {
                        case "0":
                            treeComData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "0";
                                $scope.ComStrViewSwitch.buildingID = "";
                                $scope.ComStrViewSwitch.buildingName = "";
                            });
                            break;
                        case "1":
                            blockData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                $scope.ComStrViewSwitch.unitID = "";
                                $scope.ComStrViewSwitch.unitName = "";
                                $scope.ComStrViewSwitch.mode = "1";
                            });
                            break;
                        case "2":
                            unitData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "2";
                                $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                $scope.ComStrViewSwitch.editunitName = data.unitName;
                            });
                            break;
                        case "3":
                            roomData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "3";
                                $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                            });
                            break;
                    }
                    $scope.addTree = false;
                });
            }
        });
        //请求人员数据
        $iot.persons.sum(com.id).then(function (data) {
            $timeout(function () {
                $scope.communityData.personnel = data.copy;
            });
        });
        //请求设备数据
        $iot.devices.items(com.id, function (data) {
            $timeout(function () {
                $scope.communityData.devices = data;
                $scope.ChooseauthDevice = data.copy;
                $scope.unalreadyAuthFingerprint = data.copy;
            });
        });
        //请求卡数据
        $iot.cards.sum(com.id).then(function (data) {
            console.log(data);
            $timeout(function () {
                $scope.communityData.cards = data.slice(0);
                $scope.card_viewData = data.slice(0);
            });
        });
        //请求指纹数据
        $iot.fingerprints.sum(com.id).then(function (data) {
            $timeout(function () {
                $scope.communityData.Fingerprints = data.slice(0);
                $scope.fingerprint_viewData = data.slice(0);
            });
        });
    };
    //添加楼
    $scope.addBuilding = function (id, name) {
        if (!id || !name) {
            alert("请填写完整信息！");
            return;
        }
        if (!Vadicate.blockId(id)) {
            return;
        }
        if (treeData[0].nodes.some(function (item) { return item.blockNumber === id; })) {
            alert("该楼号重复！！");
            return;
        }
        treeData[0].nodes.push({
            text: id + "--" + name,
            id: "1",
            blockNumber: id,
            blockName: name,
            nodes: []
        });
        treeData[0].nodes = orderBy(treeData[0].nodes, "blockNumber");
        $("#tree").treeview({
            data: treeData,
            levels: 2,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    //修改楼
    $scope.editBuilding = function (id, name) {
        if (!id || !name) {
            alert("请填写完整信息");
            return;
        }
        if (!Vadicate.blockId(id)) {
            return;
        }
        var _loop_2 = function (i) {
            if (treeData[0].nodes[i].blockNumber === blockData.blockNumber) {
                var otherFloor = treeData[0].nodes.filter(function (item, index) { return index !== i; });
                if (otherFloor.some(function (item) { return item.blockNumber === id; })) {
                    alert("该楼号重复！！");
                    return { value: void 0 };
                }
                treeData[0].nodes[i].blockName = name;
                treeData[0].nodes[i].blockNumber = id;
                treeData[0].nodes[i].text = id + "--" + name;
                return "break";
            }
        };
        for (var i = 0; i < treeData[0].nodes.length; i++) {
            var state_2 = _loop_2(i);
            if (typeof state_2 === "object")
                return state_2.value;
            if (state_2 === "break")
                break;
        }
        treeData[0].nodes = orderBy(treeData[0].nodes, "blockNumber");
        $("#tree").treeview({
            data: treeData,
            levels: 2,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    //删除楼
    $scope.deleteBuilding = function () {
        for (var i = 0; i < treeData[0].nodes.length; i++) {
            if (treeData[0].nodes[i].blockName === blockData.blockNumber) {
                if ($scope.communityData.devices.some(function (t) { return Helper.deviceAddressToStr(t.address).slice(0, 4) === blockData.blockNumber; })) {
                    alert("请先清除节点下的设备！");
                    return;
                }
                treeData[0].nodes.splice(i, 1);
                break;
            }
        }
        $("#tree").treeview({
            data: treeData,
            levels: 2,
            multiSelect: false //多
        });
        $timeout(function () {
            $scope.ComStrViewSwitch.mode = "0";
            $scope.ComStrViewSwitch.editbuildingID = "";
            $scope.ComStrViewSwitch.editbuildingName = "";
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    //添加单元
    $scope.addunit = function (unitid, unitname) {
        if (!unitid || !unitname) {
            alert("请填写完整信息！");
            return;
        }
        if (!Vadicate.unitId(unitid)) {
            return;
        }
        for (var i = 0; i < treeData[0].nodes.length; i++) {
            if (treeData[0].nodes[i].blockNumber === blockData.blockNumber) {
                if (treeData[0].nodes[i].nodes.some(function (item) { return item.unitNumber === unitid; })) {
                    alert("单元号重复！");
                    return;
                }
                treeData[0].nodes[i].nodes.push({
                    text: unitid + "--" + unitname,
                    id: "2",
                    blockNumber: blockData.blockNumber,
                    unitNumber: unitid,
                    unitName: unitname,
                    nodes: []
                });
                treeData[0].nodes[i].nodes = orderBy(treeData[0].nodes[i].nodes, "unitNumber");
            }
        }
        $("#tree").treeview({
            data: treeData,
            levels: 3,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    //修改单元
    $scope.editunit = function (editunitId, editunitName) {
        if (!editunitId || !editunitName) {
            alert("请填写完整信息！");
            return;
        }
        if (!Vadicate.unitId(editunitId)) {
            return;
        }
        for (var i = 0; i < treeData[0].nodes.length; i++) {
            if (treeData[0].nodes[i].blockNumber === unitData.blockNumber) {
                var _loop_3 = function (j) {
                    if (treeData[0].nodes[i].nodes[j].unitNumber === unitData.unitNumber) {
                        var otherunit = treeData[0].nodes[i].nodes.filter(function (item, index) { return index !== j; });
                        if (otherunit.some(function (item) { return item.unitNumber === editunitId; })) {
                            alert("单元号重复！");
                            return { value: void 0 };
                        }
                        treeData[0].nodes[i].nodes[j].text = editunitId + "--" + editunitName;
                        treeData[0].nodes[i].nodes[j].unitNumber = editunitId;
                        treeData[0].nodes[i].nodes[j].unitName = editunitName;
                        treeData[0].nodes[i].nodes = orderBy(treeData[0].nodes[i].nodes, "unitNumber");
                        return "break";
                    }
                };
                for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                    var state_3 = _loop_3(j);
                    if (typeof state_3 === "object")
                        return state_3.value;
                    if (state_3 === "break")
                        break;
                }
                break;
            }
        }
        $("#tree").treeview({
            data: treeData,
            levels: 3,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    $scope.deleteunit = function () {
        if ($scope.communityData.devices
            .filter(function (t) { return Helper.deviceAddressToStr(t.address).slice(0, 4) === unitData.blockNumber; })
            .some(function (t) { return Helper.deviceAddressToStr(t.address).slice(4, 6) === unitData.unitNumber; })) {
            alert("请先清除节点下的设备！");
            return;
        }
        for (var i = 0; i < treeData[0].nodes.length; i++) {
            if (treeData[0].nodes[i].blockNumber === unitData.blockNumber) {
                for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                    if (treeData[0].nodes[i].nodes[j].unitNumber === unitData.unitNumber) {
                        treeData[0].nodes[i].nodes.splice(j, 1);
                        break;
                    }
                }
                break;
            }
        }
        $("#tree").treeview({
            data: treeData,
            levels: 3,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    $scope.addroom = function (roomidstart, roomidend, storeyidstart, storeyidend) {
        if (!roomidstart || !roomidend || !storeyidstart || !storeyidend) {
            alert("请填写完整信息！");
            return;
        }
        console.log("roomidstart:" + roomidstart + "\nroomidend:" + roomidend + "\nstoreyidstart:" + storeyidstart + "\nstoreyidend:" + storeyidend);
        if (!Vadicate.flatId(roomidstart, roomidend)) {
            return;
        }
        if (!Vadicate.flatId(storeyidstart, storeyidend)) {
            return;
        }
        var floorStart = Number(storeyidstart);
        var floorEnd = Number(storeyidend);
        var roomStart = Number(roomidstart);
        var roomEnd = Number(roomidend);
        var resultroom = [];
        for (var fr = floorStart; fr <= floorEnd; fr++) {
            for (var rn = roomStart; rn <= roomEnd; rn++) {
                var id = (fr * 100 + rn + 10000).toString().slice(-4);
                resultroom.push(id);
            }
        }
        var block = Helper.findInArray(treeData[0].nodes, function (x) { return x.blockNumber === unitData.blockNumber; });
        if (block) {
            var unit_1 = Helper.findInArray(block.nodes, function (x) { return x.unitNumber === unitData.unitNumber; });
            if (unit_1) {
                var addtion = resultroom.filter(function (t) { return !unit_1.nodes.some(function (x) { return x.roomNumber === t; }); }).map(function (t) {
                    return ({
                        text: t,
                        blockNumber: unitData.blockNumber,
                        unitNumber: unitData.unitNumber,
                        roomNumber: t,
                        id: "3",
                        guid: ""
                    });
                });
                unit_1.nodes = Helper.sortedMerge(addtion, unit_1.nodes, 0, function (a, b) { return a.roomNumber.localeCompare(b.roomNumber); });
            }
        }
        $("#tree").treeview({
            data: treeData,
            levels: 3,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    $scope.editroom = function (editroomId) {
        if (!editroomId) {
            alert("房间号不能为空！");
            return;
        }
        if (editroomId.length !== 4) {
            alert("房间号格式不对！");
            return;
        }
        if (isNaN(Number(editroomId))) {
            alert("房间号格式不对！");
            return;
        }
        if (Number(editroomId) < 0 || Number(editroomId) > 9999) {
            alert("房间号格式不对！");
            return;
        }
        for (var i = 0; i < treeData[0].nodes.length; i++) {
            if (treeData[0].nodes[i].blockNumber === roomData.blockNumber) {
                for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                    if (treeData[0].nodes[i].nodes[j].unitNumber === roomData.unitNumber) {
                        for (var n = 0; n < treeData[0].nodes[i].nodes[j].nodes.length; n++) {
                            if (treeData[0].nodes[i].nodes[j].nodes[n].roomNumber === roomData.roomNumber) {
                                treeData[0].nodes[i].nodes[j].nodes[n].text = editroomId;
                                treeData[0].nodes[i].nodes[j].nodes[n].roomNumber = editroomId;
                                treeData[0].nodes[i].nodes[j].nodes = orderBy(treeData[0].nodes[i].nodes[j].nodes, "roomNumber");
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }
        $("#tree").treeview({
            data: treeData,
            levels: 3,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    $scope.deleteroom = function () {
        for (var i = 0; i < treeData[0].nodes.length; i++) {
            if (treeData[0].nodes[i].blockNumber === roomData.blockNumber) {
                for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                    if (treeData[0].nodes[i].nodes[j].unitNumber === roomData.unitNumber) {
                        for (var n = 0; n < treeData[0].nodes[i].nodes[j].nodes.length; n++) {
                            if (treeData[0].nodes[i].nodes[j].nodes[n].roomNumber === roomData.roomNumber) {
                                treeData[0].nodes[i].nodes[j].nodes.splice(n, 1);
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.editroomID = "";
                                });
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }
        $("#tree").treeview({
            data: treeData,
            levels: 4,
            multiSelect: false //多
        });
        $("#tree").on("nodeSelected", function (event, data) {
            switch (data.id) {
                case "0":
                    treeComData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "0";
                        $scope.ComStrViewSwitch.buildingID = "";
                        $scope.ComStrViewSwitch.buildingName = "";
                    });
                    break;
                case "1":
                    blockData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                        $scope.ComStrViewSwitch.unitID = "";
                        $scope.ComStrViewSwitch.unitName = "";
                        $scope.ComStrViewSwitch.mode = "1";
                    });
                    break;
                case "2":
                    unitData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "2";
                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                    });
                    break;
                case "3":
                    roomData = data;
                    $timeout(function () {
                        $scope.ComStrViewSwitch.mode = "3";
                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                    });
                    break;
            }
        });
    };
    $scope.SubmitComTree = function () {
        var submitData = {
            name: treeData[0].text,
            guid: treeData[0].guid,
            buildings: []
        };
        treeData[0].nodes.forEach(function (flooritem, floorindex) {
            submitData.buildings.push({
                id: flooritem.blockNumber,
                name: flooritem.blockName,
                units: []
            });
            flooritem.nodes.forEach(function (unititem, unitindex) {
                submitData.buildings[floorindex].units.push({
                    id: unititem.unitNumber,
                    name: unititem.unitName,
                    apartments: []
                });
                unititem.nodes.forEach(function (roomitem) {
                    submitData.buildings[floorindex].units[unitindex].apartments.push({
                        id: roomitem.roomNumber,
                        guid: roomitem.guid
                    });
                });
            });
        });
        $iot.communities
            .updateArch(submitData)
            .then(function (_) {
            alert("提交成功");
            $iot.communities.loadArch(treeData[0].guid).then(function (data) {
                $timeout(function () {
                    $scope.communityData.address = data;
                });
                treeData = Helper.toTreeItem(data);
                $("#tree").treeview({
                    data: treeData,
                    levels: 3,
                    multiSelect: false //多
                });
                $("#tree").on("nodeSelected", function (event, data) {
                    switch (data.id) {
                        case "0":
                            treeComData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "0";
                                $scope.ComStrViewSwitch.buildingID = "";
                                $scope.ComStrViewSwitch.buildingName = "";
                            });
                            break;
                        case "1":
                            blockData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                $scope.ComStrViewSwitch.unitID = "";
                                $scope.ComStrViewSwitch.unitName = "";
                                $scope.ComStrViewSwitch.mode = "1";
                            });
                            break;
                        case "2":
                            unitData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "2";
                                $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                $scope.ComStrViewSwitch.editunitName = data.unitName;
                            });
                            break;
                        case "3":
                            roomData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "3";
                                $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                            });
                            break;
                    }
                    $scope.addTree = false;
                });
            });
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*小区结构结束*/
    /*人员管理开始*/
    $scope.editing = true;
    $scope.addAddressview = true;
    $scope.addAddressListView = [];
    $scope.addAddressList = [];
    $scope.nationList = Helper.nationList;
    var refreshOrNo = true;
    $scope.addAddress = function (building, unit, room) {
        if (!building || !unit || !room) {
            alert("请选择完整地址");
            return;
        }
        if ($scope.addAddressList.some(function (item, index) { return item === room.guid; })) {
            return;
        }
        $scope.addAddressview = false;
        $scope.addAddressListView.push({
            guid: room.guid,
            name: building.name + "-" + unit.name + "-" + room.id
        });
        $scope.addAddressList.push(room.guid);
    };
    $scope.deleteAddAddress = function (id) {
        var deleteIndex;
        $scope.addAddressListView.map(function (item, index) {
            if (item.guid === id) {
                deleteIndex = index;
            }
        });
        $scope.addAddressListView.splice(deleteIndex, 1);
        $scope.addAddressList.splice(deleteIndex, 1);
    };
    //根据身份证查询人员
    $scope.queryPersonnerl = function (id) {
        if (id.length !== 18) {
            return;
        }
        var validator = new IDValidator();
        if (!validator.isValid(id)) {
            alert("身份证号码格式不正确！");
            return;
        }
        if ($scope.communityData.personnel.containKey(id)) {
            alert("身份证号码重复，请查看是否重复添加！");
            return;
        }
        $iot.persons.get(id).then(function (data) {
            if (JSON.stringify(data) === "{}") {
                return;
            }
            $timeout(function () {
                if (data.name) {
                    $scope.addName = data.name;
                }
                if (data.phone) {
                    $scope.addNumber = data.phone;
                }
                if (data.QQ) {
                    $scope.addQQ = data.QQ;
                }
                if (data.wechat) {
                    $scope.addWeChat = data.wechat;
                }
                if (data.remark) {
                    $scope.addRemark = data.remark;
                }
                if (data.occupation) {
                    $scope.addWorkUnit = data.occupation;
                }
                if (data.phoneMac) {
                    $scope.addphoneMac = data.phoneMac;
                }
            });
        });
    };
    //刷新添加人员地址
    $scope.refreshAddAddressList = function () {
        if (refreshOrNo) {
            $scope.addAddressList = [];
            $scope.addAddressListView = [];
            refreshOrNo = false;
        }
    };
    //添加人员
    $scope.addPersonnel = function (addName, addId, addNumber, addWorkUnit, addQQ, addWeChat, addphoneMac, addRemark) {
        if (!addName) {
            alert("请填写姓名!");
            return;
        }
        if ($scope.addAddressList.length === 0) {
            alert("请添加住址!");
            return;
        }
        var validator = new IDValidator();
        if (addId) {
            if (!validator.isValid(addId)) {
                alert("身份证号码格式不正确！");
                return;
            }
            if ($scope.communityData.personnel.containKey(addId)) {
                alert("身份证号码重复，请查看是否重复添加！");
                return;
            }
        }
        var addData = {
            name: addName,
            phone: addNumber,
            nric: addId,
            QQ: addQQ,
            wechat: addWeChat,
            remark: addRemark,
            occupation: addWorkUnit,
            phoneMac: addphoneMac,
            rooms: $scope.addAddressList.slice(0)
        };
        console.log(addData);
        // $iot.persons
        //     .put(addData)
        //     .then((data: Nric) => {
        //         addData.nric = data;
        //         $timeout(() => {
        //             refreshOrNo = true;
        //             $scope.communityData.personnel.addOrUpdate(addData);
        //             $scope.alertSuccess = true;
        //             $timeout(() => {
        //                 $scope.alertSuccess = false;
        //             }, 2000);
        //         });
        //     })
        //     .catch(() => {
        //         $timeout(() => {
        //             $scope.alertFail = true;
        //             $timeout(() => {
        //                 $scope.alertFail = false;
        //             }, 2000);
        //         });
        //     });
    };
    //选定人员
    var deletechoosePersonId;
    $scope.choosePersonnel = function (person) {
        $scope.choosePersonEditRooms = person.rooms.slice(0);
        $scope.chooseBackColor = person.nric;
        deletechoosePersonId = person.nric;
        $scope.choosePersonEdit = person;
        $scope.editName = person.name;
        $scope.editQQ = person.QQ;
        $scope.editPhone = person.phone;
        $scope.editOccupation = person.occupation;
        $scope.editWechat = person.wechat;
        $scope.editPhoneMac = person.phoneMac;
        $scope.editRemark = person.remark;
        $scope.choosePersonEditID = person.nric.length === 18 ? person.nric : "";
        $scope.editing = person.nric.length === 18;
    };
    //添加选定人员背景
    $scope.chooseStyle = function (person) { return ($scope.chooseBackColor === person.nric ? "success" : ""); };
    //删除人员
    $scope.deletePersonnel = function () {
        if (!deletechoosePersonId) {
            alert("请选择你要删除的人员！");
            return;
        }
        var sure = confirm("你确定删除这个人员信息吗？");
        if (!sure) {
            return;
        }
        $iot.persons
            .delete(treeData[0].guid, deletechoosePersonId)
            .then(function () {
            $timeout(function () {
                $scope.communityData.personnel.tryRemoveKey(deletechoosePersonId);
            });
            alert("删除成功！");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    //修改人员
    $scope.editAddAddress = function (building, unit, room) {
        if (!building || !unit || !room) {
            alert("请选择完整地址");
            return;
        }
        if ($scope.choosePersonEditRooms.some(function (item, index) { return item === room.guid; })) {
            return;
        }
        $scope.choosePersonEditRooms.push(room.guid);
    };
    $scope.editDeleteAddAddress = function (id) {
        var deleteIndex = $scope.choosePersonEditRooms.indexOf(id);
        if (deleteIndex !== -1)
            $scope.choosePersonEditRooms.splice(deleteIndex, 1);
    };
    $scope.editPerson = function (choosePersonEditId, editName, editQQ, editPhone, editOccupation, editWechat, editPhoneMac, editRemark) {
        var editData = {
            name: editName,
            phone: editPhone,
            nric: $scope.choosePersonEdit.nric,
            QQ: editQQ,
            wechat: editWechat,
            remark: editRemark,
            occupation: editOccupation,
            phoneMac: editPhoneMac
        };
        if (!editName) {
            alert("请填写姓名!");
            return;
        }
        if ($scope.choosePersonEditRooms.length === 0) {
            alert("请添加住址!");
            return;
        }
        var validatoredit = new IDValidator();
        if (!$scope.editing) {
            if (choosePersonEditId) {
                if (!validatoredit.isValid(choosePersonEditId)) {
                    alert("身份证号码格式不正确！");
                    return;
                }
                if ($scope.communityData.personnel.containKey(choosePersonEditId)) {
                    alert("身份证号码重复，请查看是否重复添加！");
                    return;
                }
                editData.newNric = choosePersonEditId;
            }
        }
        var deleteRooms = $scope.choosePersonEdit.rooms.filter(function (item) { return $scope.choosePersonEditRooms.indexOf(item) === -1; });
        var addRooms = $scope.choosePersonEditRooms.filter(function (item) { return $scope.choosePersonEdit.rooms.indexOf(item) === -1; });
        editData.deleteRooms = deleteRooms;
        editData.rooms = addRooms;
        $iot.persons
            .put(editData)
            .then(function (nric) {
            $timeout(function () {
                var x = $scope.communityData.personnel.$[nric];
                if (x) {
                    x.nric = nric;
                    x.name = editData.name;
                    x.phone = editData.phone;
                    x.QQ = editData.QQ;
                    x.wechat = editData.wechat;
                    x.remark = editData.remark;
                    x.occupation = editData.occupation;
                    x.phoneMac = editData.phoneMac;
                    x.rooms = $scope.choosePersonEditRooms;
                }
                $scope.alertSuccess = true;
                $timeout(function () {
                    $scope.alertSuccess = false;
                }, 2000);
            });
        })
            .catch(function () {
            $timeout(function () {
                $scope.alertFail = true;
                $timeout(function () {
                    $scope.alertFail = false;
                }, 2000);
            });
        });
    };
    /*人员管理结束*/
    /*设备管理开始*/
    var choosedeviceId;
    //添加设备
    $scope.addDevice = function (addressBuilding, addressUnit, deviceNumber, devicePwd, deviceRemark) {
        if (!addressBuilding || !addressUnit || deviceNumber.length === 0 || !devicePwd) {
            alert("请填写设备ID或者设备密码！");
            return;
        }
        if (devicePwd.length < 6) {
            alert("密码需要大于6位数！");
            return;
        }
        if (isNaN(Number(devicePwd))) {
            alert("密码必须为数字");
            return;
        }
        var deviceId = Number(addressBuilding.id + addressUnit.id + deviceNumber);
        if ($scope.communityData.devices.some(function (item) { return Number(deviceId) === item.address; })) {
            alert("该设备地址已经添加！");
            return;
        }
        var addDeviceData = {
            communityId: $scope.communityData.address.guid,
            password: devicePwd,
            address: deviceId,
            remark: deviceRemark
        };
        $iot.devices
            .put(addDeviceData)
            .then(function (data) {
            $timeout(function () {
                $scope.communityData.devices.addOrUpdate(data);
                $scope.ChooseauthDevice.addOrUpdate(data);
                $scope.unalreadyAuthFingerprint.addOrUpdate(data);
            });
            alert("提交成功");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    //选定设备
    $scope.chooseDevice = function (device) {
        choosedeviceId = device.address;
        $scope.choosedeviceGuid = device.id;
        $scope.newDevicepwd = device.password;
        $scope.newRemark = device.remark;
    };
    //选定设备高亮
    $scope.chooseDeviceStyle = function (device) { return (device.address === choosedeviceId ? "success" : ""); };
    //删除设备
    $scope.deleteDevice = function () {
        if (!choosedeviceId) {
            alert("请选择你要删除的设备！");
            return;
        }
        var sure = confirm("你确定删除这个设备吗？");
        if (!sure) {
            return;
        }
        $iot.devices
            .delete($scope.choosedeviceGuid)
            .then(function () {
            $timeout(function () {
                $scope.communityData.devices.tryRemoveKey($scope.choosedeviceGuid);
                $scope.ChooseauthDevice.tryRemoveKey($scope.choosedeviceGuid);
                $scope.unalreadyAuthFingerprint.tryRemoveKey($scope.choosedeviceGuid);
            });
            alert("删除成功！");
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    //修改设备密码
    $scope.editDevicepwd = function (newDevicepwd, newRemark) {
        if (newDevicepwd.length < 6) {
            alert("密码需要大于6位数");
            return;
        }
        if (isNaN(Number(newDevicepwd))) {
            alert("密码必须为数字");
            return;
        }
        var changepwd = {
            id: $scope.choosedeviceGuid,
            password: newDevicepwd,
            remark: newRemark
        };
        $iot.devices
            .put(changepwd)
            .then(function (data) {
            if (data) {
                $timeout(function () {
                    var x = $scope.communityData.devices.$[$scope.choosedeviceGuid];
                    if (x) {
                        x.password = newDevicepwd;
                        x.remark = newRemark;
                    }
                });
                alert("修改成功");
            }
            else {
                alert("修改失败");
            }
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    /*设备管理结束*/
    /*门禁卡管理开始*/
    //选定待授权设备判断是否可以绑定房间
    $scope.selectAuthDevice = function () {
        //获取选择的门口机
        var authDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
        //获取的门口机地址列表
        var authDeviceAddress = mapToArray(authDevice, function (x) {
            var itemValue = angular.fromJson(x.value);
            return Helper.deviceAddressToStr(itemValue.address);
        });
        if (authDeviceAddress.length === 0) {
            $scope.chooseBinding = true; //禁用绑定房复选框
            $scope.alreadyBinding = false; //禁用选择绑定房号下拉框
            return;
        }
        //如果是同一栋同一个单元，获取它的所有房间
        var getTheFlats = function () {
            var first = authDeviceAddress[0].slice(0, 6);
            if (authDeviceAddress.length > 1) {
                for (var i = 1; i < authDeviceAddress.length; i++) {
                    if (authDeviceAddress[i].slice(0, 10) !== first) {
                        return Helper.none();
                    }
                }
            }
            var block = first.slice(0, 4);
            var unit = first.slice(4);
            var flats = $iot.current.arch.communityX.items.$[block].items.$[unit].items;
            return Helper.val(flats);
        };
        getTheFlats()
            .data(function (flats) {
            $scope.chooseBinding = false; //启用绑定房复选框
            if ($("#alreadyBindingAuth").is(":checked")) {
                $scope.alreadyBinding = true; //启用选择绑定房号下拉框
            }
            $scope.bindingRoom = flats.toArray(function (x) {
                return ({
                    room: x.id,
                    id: authDeviceAddress[0].slice(0, 6) + x
                });
            });
        })
            .none(function () {
            $scope.chooseBinding = true;
            $scope.alreadyBinding = false;
            $scope.bindingRoom = [];
        });
    };
    $scope.addCardNumberValidate = true; //添加卡号验证提醒文字显示
    $scope.addcardPersonnelsValidate = true; //添加卡号，用户验证提醒文字显示
    $scope.addCardcomplete = true; //添加卡完成提醒文字显示
    $scope.chooseBinding = true;
    $scope.authCompleteinfo = [];
    //卡号验证
    function validateCardNumber(cardNumber) {
        var characterArr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        var cardNumberLow = Array.prototype.slice.call(cardNumber.toLowerCase());
        return cardNumberLow.every(function (t) { return characterArr.indexOf(t) !== -1; });
    }
    //添加卡选择房间的时候过滤人员
    $scope.cardPersonnels = Dict.ofArray(function (t) { return t.nric; }, []);
    $scope.cardPersonnel = {};
    $scope.roomPersonnel = function (roomId) {
        if (!roomId) {
            $scope.cardPersonnel = {};
            return;
        }
        var predicate = function (item) { return item.rooms.some(function (x) { return x === roomId.guid; }); };
        $scope.cardPersonnels = $scope.communityData.personnel.filter(predicate);
        if ($scope.cardPersonnels.length !== 0) {
            $scope.cardPersonnel.x = $scope.cardPersonnels.first.nric;
        }
    };
    //打开添加卡modal
    $scope.openAddCard = function () {
        $scope.speedyAddCardSuccessList = [];
        $("#speedyAddCard_input").val("");
    };
    //添加卡方式
    $scope.showSpeedyAddCard = true;
    $scope.switchAddCard = function () {
        $scope.showSpeedyAddCard = !$scope.showSpeedyAddCard;
        $scope.speedyAddCardSuccessList = [];
        $("#speedyAddCard_input").val("");
    };
    //快速添加卡信息提醒
    $scope.speedyAddCardInfo = true;
    //快速添加卡
    $scope.addCard_speedy = function (event, cardNumber) {
        var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
        if (keyCode === 13) {
            if (!cardNumber) {
                return;
            }
            if (!validateCardNumber(cardNumber)) {
                $scope.speedyAddCardInfo = false;
                $timeout(function () {
                    $scope.speedyAddCardInfo = true;
                }, 2000);
                $(".speedyAddNumber").text("卡号不符合规则！");
                return;
            }
            if ($scope.communityData.cards.some(function (t) { return t.serial === cardNumber; })) {
                $scope.speedyAddCardInfo = false;
                $("#speedyAddCard_input").val("");
                $(".speedyAddNumber").text("卡号重复！");
                $timeout(function () {
                    $scope.speedyAddCardInfo = true;
                }, 2000);
                return;
            }
            var addCardData = {
                communityId: $scope.communityData.address.guid,
                serial: cardNumber
            };
            $iot.cards
                .put(addCardData)
                .then(function (data) {
                if (!data.id) {
                    $(".speedyAddNumber").text("添加失败!");
                    $timeout(function () {
                        $scope.speedyAddCardInfo = false;
                        $timeout(function () {
                            $scope.speedyAddCardInfo = true;
                        }, 2000);
                    });
                }
                else {
                    $timeout(function () {
                        $scope.speedyAddCardSuccessList.unshift(cardNumber);
                        $("#speedyAddCard_input").val("");
                        data.auth = [];
                        $scope.communityData.cards.unshift(data);
                        $scope.card_viewData.unshift(data);
                    });
                }
            })
                .catch(function (err) {
                console.log(err);
            });
        }
    };
    //正常添加卡
    $scope.addCard = function (cardNumber, cardPersonnel) {
        if (!cardNumber) {
            $scope.addCardNumberValidate = false;
            $timeout(function () {
                $scope.addCardNumberValidate = true;
            }, 3000);
            $(".addNumber").text("请填写卡号！");
            return;
        }
        if (cardNumber.length < 8) {
            $scope.addCardNumberValidate = false;
            $timeout(function () {
                $scope.addCardNumberValidate = true;
            }, 3000);
            $(".addNumber").text("卡号需要大于8位！");
            return;
        }
        if (!validateCardNumber(cardNumber)) {
            $scope.addCardNumberValidate = false;
            $timeout(function () {
                $scope.addCardNumberValidate = true;
            }, 3000);
            $(".addNumber").text("卡号不符合规则！");
            return;
        }
        if ($scope.communityData.cards.some(function (t) { return t.serial === cardNumber; })) {
            $scope.addCardNumberValidate = false;
            $timeout(function () {
                $scope.addCardNumberValidate = true;
            }, 3000);
            $(".addNumber").text("卡号重复！");
            return;
        }
        if (!cardPersonnel) {
            $scope.addcardPersonnelsValidate = false;
            $timeout(function () {
                $scope.addcardPersonnelsValidate = true;
            }, 3000);
            $(".addCardPersonnels").text("请选择持卡人！");
            return;
        }
        var addCardData = {
            communityId: $scope.communityData.address.guid,
            nric: cardPersonnel,
            serial: cardNumber
        };
        $iot.cards
            .put(addCardData)
            .then(function (data) {
            if (!data.id) {
                $(".addCardcomplete").text("添加失败，请查看卡号是否重复!");
                $timeout(function () {
                    $scope.addCardcomplete = false;
                });
            }
            else {
                $(".addCardcomplete").text("添加成功");
                $timeout(function () {
                    $scope.addCardcomplete = false;
                    data.auth = [];
                    $scope.communityData.cards.unshift(data);
                    $scope.card_viewData.unshift(data);
                });
            }
            $timeout(function () {
                $scope.addCardcomplete = true;
            }, 3000);
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    //选定卡
    var lastTimeCard;
    var thisTimeCard;
    $scope.chooseCard = function (index, event, card) {
        var $target = $("#" + index);
        if (event.shiftKey) {
            thisTimeCard = Number(index);
            if (lastTimeCard !== undefined) {
                if (thisTimeCard > lastTimeCard) {
                    for (var i = lastTimeCard; i <= thisTimeCard; i++) {
                        $("#" + i).attr("checked", true);
                        $("#" + i)
                            .parent()
                            .parent()
                            .addClass("bg-success");
                    }
                }
                else {
                    for (var i = thisTimeCard; i <= lastTimeCard; i++) {
                        $("#" + i).attr("checked", true);
                        $("#" + i)
                            .parent()
                            .parent()
                            .addClass("bg-success");
                    }
                }
                lastTimeCard = Number(index);
                document.getSelection().empty();
            }
            else {
                $target.attr("checked", true);
                $target
                    .parent()
                    .parent()
                    .addClass("bg-success");
                lastTimeCard = Number(index);
            }
        }
        else {
            if ($target.is(":checked")) {
                $target.attr("checked", false);
                $target
                    .parent()
                    .parent()
                    .removeClass("bg-success");
                lastTimeCard = Number(index);
            }
            else {
                $target.attr("checked", true);
                $target
                    .parent()
                    .parent()
                    .addClass("bg-success");
                lastTimeCard = Number(index);
            }
        }
        var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
        var selectCardList = mapToArray(selectCard, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
        if (selectCardList.length === 0) {
            $scope.tobe_editCardList = [];
            $scope.cardEdit_show = false;
        }
        else {
            if (selectCardList.every(function (value) { return value.auth.length === 0; })) {
                $scope.tobe_editCardList = selectCardList;
                $scope.cardEdit_show = true;
            }
            else {
                $scope.tobe_editCardList = [];
                $scope.cardEdit_show = false;
            }
        }
        $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
        $scope.alreadyAuth = Helper.unionAuths(selectCardList);
    };
    //全选卡
    $scope.selectAllCard = function () {
        var cardAll = $("input:checkbox[name='chooseAuthCard']");
        cardAll.attr("checked", true);
        cardAll
            .parent()
            .parent()
            .addClass("bg-success");
        var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
        var selectCardList = mapToArray(selectCard, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
        if (selectCardList.every(function (value) { return value.auth.length === 0; })) {
            $scope.tobe_editCardList = selectCardList;
            $scope.cardEdit_show = true;
        }
        else {
            $scope.tobe_editCardList = [];
            $scope.cardEdit_show = false;
        }
        $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
        $scope.alreadyAuth = Helper.unionAuths(selectCardList);
    };
    //取消选择卡
    $scope.selectAllCard_not = function () {
        var cardAll = $("input:checkbox[name='chooseAuthCard']");
        cardAll.attr("checked", false);
        cardAll
            .parent()
            .parent()
            .removeClass("bg-success");
        var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
        var selectCardList = mapToArray(selectCard, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
        $scope.tobe_editCardList = [];
        $scope.cardEdit_show = false;
        $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
        $scope.alreadyAuth = Helper.unionAuths(selectCardList);
    };
    $scope.selectBinding = function () {
        if ($("#alreadyBindingAuth").is(":checked")) {
            $scope.alreadyBinding = true;
        }
        else {
            $scope.alreadyBinding = false;
        }
    };
    //编辑按钮默认不显示
    $scope.cardEdit_show = false;
    $scope.editCardcomplete = true;
    //打开编辑卡
    $scope.tobe_editCardSerial = "";
    $scope.selectCard_Edit = function () {
        console.log($scope.tobe_editCardList);
        if ($scope.tobe_editCardList.length === 1) {
            if ($scope.tobe_editCardList[0].nric) {
                var editCardRooms = $filter("nricTorooms")($scope.tobe_editCardList[0].nric, $scope.communityData.personnel);
                var flat = $iot.communities.flatten($scope.communityData.address.guid, editCardRooms[0]);
                $scope.editCard_address = {
                    building: flat.block,
                    unit: flat.unit,
                    room: flat.flat,
                    nric: $scope.tobe_editCardList[0].nric
                };
                $scope.roomPersonnel($scope.editCard_address.room);
            }
            else {
                $scope.roomPersonnel();
                $scope.editCard_address = {};
            }
        }
        else {
            $scope.roomPersonnel();
            $scope.editCard_address = {};
        }
        $scope.tobe_editCardList.forEach(function (value) {
            $scope.tobe_editCardSerial = $scope.tobe_editCardSerial + value.serial + "；";
        });
    };
    //编辑卡
    $scope.editCard = function (nric) {
        var _loop_4 = function (i) {
            var editData = $scope.tobe_editCardList[i];
            var cardData = {
                communityId: editData.communityId,
                id: editData.id,
                nric: nric,
                serial: editData.serial,
            };
            $iot.cards
                .put(cardData)
                .then(function (data) {
                if (!data.id) {
                    $(".editCardcomplete").text(editData.serial + "编辑失败!");
                    $timeout(function () {
                        $scope.editCardcomplete = false;
                    });
                }
                else {
                    $(".editCardcomplete").text(data.serial + "提交成功");
                    $timeout(function () {
                        $scope.editCardcomplete = false;
                        data.auth = [];
                        var lengthCardCom = $scope.communityData.cards.length;
                        var lengthCardView = $scope.card_viewData.length;
                        for (var i_1 = 0; i_1 < lengthCardCom; i_1++) {
                            if ($scope.communityData.cards[i_1].id === data.id) {
                                $scope.communityData.cards[i_1].nric = data.nric;
                                break;
                            }
                        }
                        for (var i_2 = 0; i_2 < lengthCardView; i_2++) {
                            if ($scope.card_viewData[i_2].id === data.id) {
                                $scope.card_viewData[i_2].nric = data.nric;
                                break;
                            }
                        }
                    });
                }
                $timeout(function () {
                    $scope.editCardcomplete = true;
                }, 2000);
            })
                .catch(function (err) {
                console.log(err);
            });
        };
        for (var i = 0; i < $scope.tobe_editCardList.length; i++) {
            _loop_4(i);
        }
    };
    //删除卡
    $scope.deleteCard = function () {
        var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
        var selectCardList = mapToArray(selectCard, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
        if (selectCardList.length === 0) {
            return;
        }
        var sure = confirm("你确定删除这" + selectCardList.length + "张卡吗？");
        if (!sure) {
            return;
        }
        for (var i = 0; i < selectCardList.length; i++) {
            if (selectCardList[i].auth.length === 0) {
                deleteCardGenerator(selectCardList[i]);
            }
            else {
                sure = confirm("卡号:" + selectCardList[i].serial + "因有授权无法删除！是否继续删除剩余卡？");
                if (!sure) {
                    break;
                }
            }
        }
        function deleteCardGenerator(carddata) {
            $iot.cards
                .delete(carddata)
                .then(function () {
                $timeout(function () {
                    $scope.communityData.cards.forEach(function (item, index) {
                        if (item.id === carddata.id) {
                            $scope.communityData.cards.splice(index, 1);
                        }
                    });
                    $scope.card_viewData.forEach(function (item, index) {
                        if (item.id === carddata.id) {
                            $scope.card_viewData.splice(index, 1);
                        }
                    });
                });
            })
                .catch(function (err) {
                console.log(err);
            });
        }
    };
    function issueSuccess(deviceIdx, secretIdx, devices, secrets) {
        if (secretIdx === 0) {
            $scope.authCompleteinfo.push({
                device: devices[deviceIdx],
                success: [secrets[secretIdx]],
                fail: []
            });
        }
        else {
            $scope.authCompleteinfo[deviceIdx].success.push(secrets[secretIdx]);
        }
    }
    function issueFail(deviceIdx, secretIdx, devices, secrets, message) {
        if (deviceIdx === 0) {
            $scope.authCompleteinfo.push({
                device: devices[deviceIdx],
                success: [],
                fail: secrets.slice(deviceIdx),
                message: message
            });
        }
        else {
            $scope.authCompleteinfo[deviceIdx].fail.concat(secrets.slice(deviceIdx));
            $scope.authCompleteinfo[deviceIdx].message = message;
        }
    }
    function issueIgnoreError(deviceIdx, secretIdx, devices, secrets, message) {
        if (secretIdx === 0) {
            $scope.authCompleteinfo.push({
                device: devices[deviceIdx],
                success: [],
                fail: [secrets[secretIdx]],
                message: message
            });
        }
        else {
            $scope.authCompleteinfo[deviceIdx].fail.push(secrets[secretIdx]);
        }
    }
    //授权生成器
    function authGenerator(cardList, deviceList, $time, $binding) {
        var getNext = Helper.permitGenerator(cardList, deviceList);
        function auth(deviceIdx, cardIdx) {
            var subData = {
                deviceId: deviceList[deviceIdx],
                expire: $time,
                binding: $binding
            };
            $iot.cards
                .issue(cardList[cardIdx], subData)
                .then(function (data) {
                var value = data.errorCode === 70000003 || data.result;
                if (data.result) {
                    $timeout(function () {
                        $scope.communityData.cards.forEach(function (t) {
                            if (t.id === cardList[cardIdx]) {
                                t.auth.push({
                                    deviceId: deviceList[deviceIdx],
                                    expire: $time,
                                    binding: $binding
                                });
                            }
                        });
                    });
                }
                if (value) {
                    issueSuccess(deviceIdx, cardIdx, deviceList, cardList);
                }
                else {
                    issueFail(deviceIdx, cardIdx, deviceList, cardList, data.message);
                }
                if (deviceIdx === deviceList.length - 1) {
                    if (!value || cardIdx === cardList.length - 1) {
                        $timeout(function () {
                            var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
                            var selectCardList = mapToArray(selectCard, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
                            $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
                            $scope.alreadyAuth = Helper.unionAuths(selectCardList);
                        });
                    }
                }
                getNext(value, auth);
            })
                .catch(function (err) {
                console.log(err);
            });
        }
        getNext(true, auth);
    }
    //授权
    //是否选择时间
    $scope.alreadyTime = false;
    $scope.validityTimeDefault = function () {
        if ($("#alreadyTimeAuth").is(":checked")) {
            var nowDate = new Date().format("yyyy-MM-dd") + "T" + "00:00";
            $("#validityTime").val(nowDate);
        }
    };
    //是否选择绑定房号
    $scope.alreadyBinding = false;
    $scope.authCardToDevice = function () {
        var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
        var authCardList = Helper.getSeq(selectCard)
            .map(function (x) { return angular.fromJson(x.value); })
            .filter(function (x) { return !!x.nric; })
            .map(function (x) { return x.id; })
            .toArray();
        if (authCardList.length === 0) {
            alert("请选择授权卡");
            return;
        }
        var selectDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
        var authDeviceList = mapToArray(selectDevice, function (x) { return angular.fromJson(x.value).id; });
        if (authDeviceList.length === 0) {
            alert("请选择设备");
            return;
        }
        var $time;
        var $binding;
        if ($("#alreadyTimeAuth").is(":checked")) {
            var val = $("#validityTime").val();
            $time = Math.floor(new Date(val).getTime() / 1000);
        }
        else {
            $time = undefined;
        }
        if ($("#alreadyBindingAuth").is(":checked") && !$scope.chooseBinding) {
            $binding = $("#bindingRoomAddress").val();
        }
        else {
            $binding = undefined;
        }
        $scope.authCompleteinfo = [];
        authGenerator(authCardList, authDeviceList, $time, $binding);
    };
    //取消授权
    $scope.deleteAuthCard = function () {
        var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
        var authCardList = mapToArray(selectCard, function (x) { return angular.fromJson(x.value).id; });
        if (authCardList.length === 0) {
            alert("请选择卡");
            return;
        }
        var unAuthDevice = angular.element("input:checkbox[name='chooseAlreadyAuth']:checked");
        var unAuthDeviceList = mapToArray(unAuthDevice, function (x) { return angular.fromJson(x.value).deviceId; });
        function unauthGenerator(cardList, deviceList) {
            var getNext = Helper.permitGenerator(cardList, deviceList);
            function auth(deviceIdx, cardIdx) {
                var subData = {
                    deviceId: deviceList[deviceIdx]
                };
                $iot.cards
                    .withdraw(cardList[cardIdx], subData)
                    .then(function (data) {
                    if (data.result) {
                        $timeout(function () {
                            $scope.communityData.cards.forEach(function (t) {
                                if (t.id === cardList[cardIdx]) {
                                    t.auth.forEach(function (t2, index) {
                                        if (t2.deviceId === deviceList[deviceIdx]) {
                                            t.auth.splice(index, 1);
                                        }
                                    });
                                }
                            });
                        });
                    }
                    if (data.result) {
                        issueSuccess(deviceIdx, cardIdx, deviceList, cardList);
                    }
                    else {
                        issueFail(deviceIdx, cardIdx, deviceList, cardList, data.message);
                    }
                    if (deviceIdx === deviceList.length - 1) {
                        if (!data.result || cardIdx === cardList.length - 1) {
                            $timeout(function () {
                                //const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
                                var selectCardList = mapToArray(selectCard, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
                                $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
                                $scope.alreadyAuth = Helper.unionAuths(selectCardList);
                            });
                        }
                    }
                    getNext(data.result, auth);
                })
                    .catch(function (err) {
                    console.log(err);
                });
            }
            getNext(true, auth);
        }
        $scope.authCompleteinfo = [];
        unauthGenerator(authCardList, unAuthDeviceList);
    };
    //卡片查询过滤器
    $scope.cardFilter = function (str) {
        $scope.card_viewData = !str
            ? $scope.communityData.cards.slice(0)
            : $scope.communityData.cards.filter(function (item) {
                for (var prop in item) {
                    if (item.hasOwnProperty(prop)) {
                        if (prop === "serial") {
                            if (item[prop].indexOf(str) !== -1) {
                                return true;
                            }
                        }
                        else if (prop === "nric") {
                            if (item[prop].indexOf(str) !== -1 || $filter("nricToname")(item[prop], $scope.communityData.personnel).indexOf(str) !== -1) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            });
    };
    /*门禁卡管理结束*/
    /*指纹管理开始*/
    //手指是否已经录入提醒是否显示
    $scope.chooseFingersInfoHide = true;
    //手指数据
    $scope.FingerConstans = Helper.fingerConstans;
    function createFingerprint() {
        var fp = $fp.create();
        fp.onImage = function (index, image) {
            switch (index) {
                case 0:
                    $("#fingerprint1").attr("src", image);
                    break;
                case 1:
                    $("#fingerprint2").attr("src", image);
                    break;
                case 2:
                    $("#fingerprint3").attr("src", image);
                    break;
            }
        };
        fp.onsuccess = function () {
            $("#FingersInfo")
                .text("采集成功，请保存！")
                .removeClass("text-danger")
                .addClass("text-success");
        };
        fp.onfail = function () {
            $("#FingersInfo")
                .text("采集失败，请重新采集！")
                .removeClass("text-success")
                .addClass("text-danger");
            $("#fingerprint1").attr("src", "images/scanfinger1.png");
            $("#fingerprint2").attr("src", "images/scanfinger2.png");
            $("#fingerprint3").attr("src", "images/scanfinger3.png");
        };
        fp.onreset = function () {
            if (!$scope.websocketIsready) {
                $("#FingersInfo")
                    .text("指纹服务连接成功!")
                    .removeClass("text-danger")
                    .addClass("text-success");
            }
            else {
                $("#FingersInfo")
                    .text("指纹服务连接失败，请查看是否启动服务或重新打开模块！")
                    .removeClass("text-success")
                    .addClass("text-danger");
            }
        };
        fp.onerror = function () {
            $timeout(function () {
                $scope.websocketIsready = true;
            });
            $("#FingersInfo")
                .text("指纹服务连接失败，请查看是否启动服务或重新打开模块！")
                .removeClass("text-success")
                .addClass("text-danger");
            $("#fingerprint1").attr("src", "images/scanfinger1.png");
            $("#fingerprint2").attr("src", "images/scanfinger2.png");
            $("#fingerprint3").attr("src", "images/scanfinger3.png");
        };
        fp.onopen = function () {
            $timeout(function () {
                $scope.websocketIsready = false;
            });
            $("#FingersInfo")
                .text("指纹服务连接成功！")
                .removeClass("text-danger")
                .addClass("text-success");
            $("#fingerprint1").attr("src", "images/scanfinger1.png");
            $("#fingerprint2").attr("src", "images/scanfinger2.png");
            $("#fingerprint3").attr("src", "images/scanfinger3.png");
        };
        fp.onclose = function () {
            $timeout(function () {
                $scope.websocketIsready = true;
            });
            $("#FingersInfo")
                .text("指纹服务连接失败，请查看是否启动服务或重新打开模块！")
                .removeClass("text-success")
                .addClass("text-danger");
        };
        return fp;
    }
    var fpService;
    //已经添加过
    var fingeradded = [];
    //切换手指初始化指纹输入
    $scope.chooseFingerConstans = function (finger) {
        if (fingeradded.some(function (t) { return t.finger === Number(finger); })) {
            $scope.chooseFingersInfoHide = false;
        }
        else {
            $scope.chooseFingersInfoHide = true;
        }
        fpService.reset();
        $("#fingerprint1").attr("src", "images/scanfinger1.png");
        $("#fingerprint2").attr("src", "images/scanfinger2.png");
        $("#fingerprint3").attr("src", "images/scanfinger3.png");
    };
    //获取用户已经保存的指纹
    $scope.getUserFingerprints = function (user) {
        if (!user) {
            return;
        }
        $iot.fingerprints.get(JSON.parse(user).nric).then(function (data) {
            fingeradded = data;
            console.log(data);
            console.log($scope.communityData.Fingerprints);
        });
    };
    //是否已经有指纹信息
    $scope.chooseFinger = function (finger) {
        return !finger ? finger : fingeradded.some(function (t) { return t.finger === finger.id; }) ? "text-success" : "text-danger";
    };
    //打开添加指纹
    $scope.openAddFinger = function () {
        fpService = createFingerprint();
        $("#addFinger").modal("show");
    };
    //重置指纹读取
    $scope.resetFinger = function () {
        fpService.reset();
        $("#fingerprint1").attr("src", "images/scanfinger1.png");
        $("#fingerprint2").attr("src", "images/scanfinger2.png");
        $("#fingerprint3").attr("src", "images/scanfinger3.png");
    };
    //关闭添加指纹
    $scope.closeAddFinger = function () {
        $("#addFinger").modal("hide");
        fpService.close();
    };
    //添加指纹
    $scope.addFinger = function (finger, user) {
        if (!finger) {
            alert("请选择手指");
            return;
        }
        if (!user) {
            alert("请选择用户！");
            return;
        }
        if (!fpService.item) {
            if (fingeradded.some(function (t) { return t.finger === Number(finger); })) {
                var subData_1 = {
                    communityId: $scope.communityData.address.guid
                };
                for (var i = 0; i < fingeradded.length; i++) {
                    if (fingeradded[i].finger === Number(finger)) {
                        subData_1.id = fingeradded[i].id;
                        break;
                    }
                }
                if ($scope.communityData.Fingerprints.some(function (t) { return t.id === subData_1.id; })) {
                    $("#FingersInfo")
                        .text("已经绑定该小区")
                        .removeClass("text-danger")
                        .addClass("text-success");
                    $timeout(function () {
                        $scope.resetFinger();
                    }, 1000);
                }
                else {
                    $iot.fingerprints
                        .bind(subData_1)
                        .then(function (data) {
                        if (data) {
                            $("#FingersInfo")
                                .text("保存成功")
                                .removeClass("text-danger")
                                .addClass("text-success");
                            var addData_1 = {
                                auth: [],
                                finger: Number(finger),
                                id: subData_1.id,
                                nric: JSON.parse(user).nric
                            };
                            $timeout(function () {
                                $scope.resetFinger();
                            }, 1000);
                            $timeout(function () {
                                $scope.communityData.Fingerprints.unshift(addData_1);
                                $scope.fingerprint_viewData.unshift(addData_1);
                            });
                        }
                        else {
                            $("#FingersInfo")
                                .text("保存失败")
                                .removeClass("text-success")
                                .addClass("text-danger");
                        }
                    })
                        .catch(function (err) {
                        console.log(err);
                    });
                }
            }
            else {
                alert("请采集指纹");
                return;
            }
        }
        else {
            var subData = fpService.item;
            subData.communityId = $scope.communityData.address.guid;
            subData.nric = JSON.parse(user).nric;
            subData.finger = Number(finger);
            $iot.fingerprints
                .put(subData)
                .then(function (data) {
                $("#FingersInfo")
                    .text("保存成功")
                    .removeClass("text-danger")
                    .addClass("text-success");
                data.auth = [];
                $timeout(function () {
                    $scope.resetFinger();
                }, 1000);
                var haveuser = $scope.communityData.Fingerprints.filter(function (item) { return item.nric === data.nric; });
                if (haveuser.length === 0) {
                    $timeout(function () {
                        $scope.communityData.Fingerprints.unshift(data);
                        $scope.fingerprint_viewData.unshift(data);
                    });
                }
                else {
                    var havefinger_1 = haveuser.filter(function (item) { return item.finger === data.finger; });
                    if (havefinger_1.length === 0) {
                        $timeout(function () {
                            $scope.communityData.Fingerprints.push(data);
                            $scope.fingerprint_viewData.push(data);
                        });
                    }
                    else {
                        $timeout(function () {
                            console.log($scope.communityData.Fingerprints);
                            console.log($scope.fingerprint_viewData);
                            havefinger_1[0].id = data.id;
                            console.log($scope.communityData.Fingerprints);
                            console.log($scope.fingerprint_viewData);
                        });
                    }
                }
            })
                .catch(function (err) {
                console.log(err);
            });
        }
    };
    //选定指纹
    var thisTimeFinger;
    var lastTimeFinger;
    $scope.chooseFingerprint = function (index, event, fingerprint) {
        var $target = $("#" + index);
        if (event.shiftKey) {
            thisTimeFinger = Number(index);
            if (lastTimeFinger !== undefined) {
                if (thisTimeFinger > lastTimeFinger) {
                    for (var i = lastTimeFinger; i <= thisTimeFinger; i++) {
                        $("#" + i).attr("checked", true);
                        $("#" + i)
                            .parent()
                            .parent()
                            .addClass("bg-success");
                    }
                }
                else {
                    for (var i = thisTimeFinger; i <= lastTimeFinger; i++) {
                        $("#" + i).attr("checked", true);
                        $("#" + i)
                            .parent()
                            .parent()
                            .addClass("bg-success");
                    }
                }
                lastTimeFinger = Number(index);
                document.getSelection().empty();
            }
            else {
                $target.attr("checked", true);
                $target
                    .parent()
                    .parent()
                    .addClass("bg-success");
                lastTimeFinger = Number(index);
            }
        }
        else {
            if ($target.is(":checked")) {
                $target.attr("checked", false);
                $target
                    .parent()
                    .parent()
                    .removeClass("bg-success");
                lastTimeFinger = Number(index);
            }
            else {
                $target.attr("checked", true);
                $target
                    .parent()
                    .parent()
                    .addClass("bg-success");
                lastTimeFinger = Number(index);
            }
        }
        var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
        var selectfingerprintList = mapToArray(selectfingerprint, function (x) { return angular.fromJson(x.value); }); //选择的列表
        $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
        $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
    };
    //全选指纹
    $scope.selectAllFingerprint = function () {
        var cardAll = $("input:checkbox[name='chooseAuthFingerprint']");
        cardAll.attr("checked", true);
        cardAll
            .parent()
            .parent()
            .addClass("bg-success");
        var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
        var selectfingerprintList = mapToArray(selectfingerprint, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
        $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
        $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
    };
    //取消选择指纹
    $scope.selectAllfingerprint_not = function () {
        var cardAll = $("input:checkbox[name='chooseAuthFingerprint']");
        cardAll.attr("checked", false);
        cardAll
            .parent()
            .parent()
            .removeClass("bg-success");
        var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
        var selectfingerprintList = mapToArray(selectfingerprint, function (x) { return angular.fromJson(x.value); }); //选择卡的列表
        $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
        $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
    };
    //删除指纹
    $scope.deletefingerprint = function () {
        var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
        var selectfingerprintList = mapToArray(selectfingerprint, function (x) { return angular.fromJson(x.value); }); //选择指纹的列表
        if (selectfingerprintList.length === 0) {
            return;
        }
        if (!confirm("\u4F60\u786E\u5B9A\u5220\u9664\u8FD9" + selectfingerprintList.length + "\u4E2A\u6307\u7EB9\u5417\uFF1F")) {
            return;
        }
        for (var i = 0; i < selectfingerprintList.length; i++) {
            if (selectfingerprintList[i].auth.length === 0) {
                deleteFingerprintGenerator(selectfingerprintList[i]);
            }
            else {
                var name_1 = $filter("nricToname")(selectfingerprintList[i].nric, $scope.communityData.personnel);
                var finger = $filter("fingerFilter")(selectfingerprintList[i].finger);
                if (!confirm("\u6307\u7EB9:" + name_1 + finger + "\u7684\u6307\u7EB9\u5DF2\u6388\u6743\uFF0C\u65E0\u6CD5\u5220\u9664\uFF01\u662F\u5426\u7EE7\u7EED\u5220\u9664\u5269\u4F59\u6307\u7EB9\uFF1F")) {
                    break;
                }
            }
        }
        function deleteFingerprintGenerator(fingerprintdata) {
            var deleteData = {
                communityId: $scope.communityData.address.guid,
                id: fingerprintdata.id
            };
            $iot.fingerprints
                .delete(deleteData)
                .then(function () {
                $timeout(function () {
                    $scope.communityData.Fingerprints.forEach(function (item, index) {
                        if (item.id === fingerprintdata.id) {
                            $scope.communityData.Fingerprints.splice(index, 1);
                        }
                    });
                    $scope.fingerprint_viewData.forEach(function (item, index) {
                        if (item.id === fingerprintdata.id) {
                            $scope.fingerprint_viewData.splice(index, 1);
                        }
                    });
                });
            })
                .catch(function (err) {
                console.log(err);
            });
        }
    };
    function fingerprintAuthGenerator(fingerprintList, deviceList, $time, $binding) {
        var getNext = Helper.permitGenerator(fingerprintList, deviceList);
        function auth(deviceIdx, fpIdx) {
            var subData = {
                deviceId: deviceList[deviceIdx],
                expire: $time,
                binding: $binding
            };
            $iot.fingerprints
                .issue(fingerprintList[fpIdx], subData)
                .then(function (data) {
                var value = data.errorCode === 70000003 || data.errorCode === 24 || data.result;
                if (data.result) {
                    $timeout(function () {
                        $scope.communityData.Fingerprints.forEach(function (t) {
                            if (t.id === fingerprintList[fpIdx]) {
                                t.auth.push({
                                    deviceId: deviceList[deviceIdx],
                                    expire: $time,
                                    binding: $binding
                                });
                            }
                        });
                    });
                }
                if (data.errorCode === 70000003 || data.result) {
                    issueSuccess(deviceIdx, fpIdx, deviceList, fingerprintList);
                }
                else if (data.errorCode === 24) {
                    issueIgnoreError(deviceIdx, fpIdx, deviceList, fingerprintList, data.message);
                }
                else {
                    issueFail(deviceIdx, fpIdx, deviceList, fingerprintList, data.message);
                }
                if (deviceIdx === deviceList.length - 1) {
                    if (!value || fpIdx === fingerprintList.length - 1) {
                        $timeout(function () {
                            /*更新授权和未授权门口机列表*/
                            var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
                            var selectfingerprintList = mapToArray(selectfingerprint, function (x) { return angular.fromJson(x.value); }); //选择指纹的列表
                            $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
                            $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
                        });
                    }
                }
                getNext(value, auth);
            })
                .catch(function (err) {
                console.log(err);
            });
        }
        getNext(true, auth);
    }
    //授权指纹到门口机
    $scope.authFingerprintToDevice = function () {
        var selectFingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
        var authFingerprintList = mapToArray(selectFingerprint, function (x) { return angular.fromJson(x.value); });
        if (authFingerprintList.length === 0) {
            alert("请选择授权指纹");
            return;
        }
        var selectDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
        var authDeviceList = mapToArray(selectDevice, function (x) { return angular.fromJson(x.value).id; });
        if (authDeviceList.length === 0) {
            alert("请选择设备");
            return;
        }
        var $time;
        var $binding;
        if ($("#alreadyTimeAuth").is(":checked")) {
            $time = new Date($("#validityTime").val()).getTime() / 1000;
        }
        else {
            $time = undefined;
        }
        if ($("#alreadyBindingAuth").is(":checked") && !$scope.chooseBinding) {
            $binding = $("#bindingRoomAddress").val();
        }
        else {
            $binding = undefined;
        }
        $scope.authCompleteinfo = [];
        fingerprintAuthGenerator(authFingerprintList, authDeviceList, $time, $binding);
    };
    //取消授权指纹
    $scope.deleteAuthfingerprint = function () {
        var selectFingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
        var authFingerprintList = mapToArray(selectFingerprint, function (x) { return angular.fromJson(x.value).id; });
        var unAuthDevice = angular.element("input:checkbox[name='chooseAlreadyAuth']:checked");
        var unAuthDeviceList = mapToArray(unAuthDevice, function (x) { return angular.fromJson(x.value).deviceId; });
        if (authFingerprintList.length === 0 || unAuthDeviceList.length === 0) {
            return;
        }
        function unauthGenerator(fingerprintList, deviceList) {
            var getNext = Helper.permitGenerator(fingerprintList, deviceList);
            function auth(deviceIdx, fpIdx) {
                var subData = {
                    deviceId: deviceList[deviceIdx]
                };
                $iot.fingerprints
                    .withdraw(fingerprintList[fpIdx], subData)
                    .then(function (data) {
                    var value = data.errorCode === 70000003 || data.result;
                    if (data.result) {
                        $timeout(function () {
                            $scope.communityData.Fingerprints.forEach(function (t) {
                                if (t.id === fingerprintList[fpIdx]) {
                                    t.auth.forEach(function (t2, index) {
                                        if (t2.deviceId === deviceList[deviceIdx]) {
                                            t.auth.splice(index, 1);
                                        }
                                    });
                                }
                            });
                        });
                    }
                    if (value) {
                        issueSuccess(deviceIdx, fpIdx, deviceList, fingerprintList);
                    }
                    else {
                        issueFail(deviceIdx, fpIdx, deviceList, fingerprintList, data.message);
                    }
                    if (deviceIdx === deviceList.length - 1) {
                        if (!data.result || fpIdx === fingerprintList.length - 1) {
                            $timeout(function () {
                                /*更新授权和未授权门口机列表*/
                                var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
                                var selectfingerprintList = mapToArray(selectfingerprint, function (x) { return angular.fromJson(x.value); }); //选择指纹的列表
                                $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
                                $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
                            });
                        }
                    }
                    getNext(value, auth);
                })
                    .catch(function (err) {
                    console.log(err);
                });
            }
            getNext(true, auth);
        }
        $scope.authCompleteinfo = [];
        unauthGenerator(authFingerprintList, unAuthDeviceList);
    };
    //指纹查询过滤器
    $scope.fingerprintFilter = function (str) {
        if (!str) {
            $scope.fingerprint_viewData = $scope.communityData.Fingerprints.slice(0);
            return;
        }
        var filterData = [];
        $scope.communityData.Fingerprints.forEach(function (item) {
            for (var prop in item) {
                if (item.hasOwnProperty(prop)) {
                    if (prop === "nric") {
                        if (item[prop].indexOf(str) !== -1) {
                            filterData.push(item);
                            break;
                        }
                        else {
                            if ($filter("nricToname")(item[prop], $scope.communityData.personnel).indexOf(str) !== -1) {
                                filterData.push(item);
                                break;
                            }
                        }
                    }
                }
            }
        });
        $scope.fingerprint_viewData = filterData;
    };
    /*指纹管理结束*/
    /*广告投放开始*/
    //广告系统视图加载
    $scope.chooseadvertisingView = function (viewNumber) {
        switch (viewNumber) {
            case 1:
                sideUrlChooseAdvertising = 1;
                $scope.selectedAdView = 1;
                return;
            case 2:
                sideUrlChooseAdvertising = 2;
                $scope.selectedAdView = 2;
                return;
        }
    };
    $scope.functionaladvertisingView = function () {
        switch ($scope.selectedAdView) {
            case 1:
                $("#uploadFile").on("show.bs.collapse", function () {
                    $("#selectedPlayCom").multiselect();
                });
                return "views/AdvertisingView/fileManagement.html";
            case 2:
                return "views/AdvertisingView/advertisingLaunch.html";
            default:
                if (!$scope.hideAdFileManage) {
                    sideUrlChooseAdvertising = 1;
                    return "views/AdvertisingView/fileManagement.html";
                }
                if (!$scope.hideAdLaunch) {
                    sideUrlChooseAdvertising = 2;
                    return "views/AdvertisingView/advertisingLaunch.html";
                }
        }
    };
    //个人文件获取
    $scope.getAdminAdvertisingFile = function () {
        $iot.advertising.files.sum().then(function (data) {
            $timeout(function () {
                console.log(data);
                $scope.adminData.Advertising = data;
            });
        });
    };
    //上传广告
    $scope.upAdvertisingFile = function () {
        var upForm = $("#upFileForm");
        var formData = new FormData(upForm[0]);
        /*var $time = form_data.get("Term");
        var $timeStrap = new Date($time).getTime()/1000;
        form_data.set('Term', $timeStrap);*/
        /*mp4 = 1 flv = 2*/
        var type = formData.get("File").type;
        var size = formData.get("File").size;
        console.log(type);
        console.log(size);
        if (size > 30000000) {
            alert("文件过大,不能超过28M");
            return;
        }
        if (type !== "video/mp4" && type !== "video/flv") {
            alert("只允许上传mp4或者flv视频");
            return;
        }
        if (type === "video/mp4") {
            formData.set("DataType", "1");
        }
        if (type === "video/flv") {
            formData.set("DataType", "2");
        }
        $iot.advertising.files.post(formData).then(function (id) {
            $timeout(function () {
                $scope.adminData.Advertising.push({
                    title: String(formData.get("Title")),
                    id: id,
                    remark: String(formData.get("Remark")),
                    communities: formData.getAll("Communities").map(String)
                });
            });
        });
    };
    //编辑广告文件
    $scope.open_EditFile = function (file) {
        $scope.whoFile = JSON.parse(JSON.stringify(file));
        $("#editPlayCom").multiselect();
        $("#editFile").modal("show");
    };
    $scope.editFile = function () {
        var upForm = $("#editFileForm");
        var formData = new FormData(upForm[0]);
        var reqData = {
            id: $scope.whoFile.id,
            title: formData.get("Title"),
            remark: formData.get("Remark"),
            communities: formData.getAll("Communities")
        };
        console.log(reqData);
        $iot.advertising.files.put(reqData).then(function () { });
    };
    //获取小区播放计划
    $scope.getComPlans = function (com) {
        $scope.authADCompleteinfo = [];
        $iot.advertising.plans.get(com).then(function (data) {
            $timeout(function () {
                console.log(data);
                $scope.communityData.AdvertisingPlans = data;
            });
        });
        //请求设备数据
        $iot.devices.items(com, function (data) {
            $timeout(function () {
                $scope.communityData.ADunAuthDevice = data.copy;
                $scope.ChooseauthDevice_AD = Dict.zero(function (t) { return t.id; });
                $scope.alreadyAuth_AD = Dict.zero(function (t) { return t.id; });
            });
        });
    };
    //获取小区的广告文件
    var chooseComAdvertising;
    $scope.getcomAdFile = function (com) {
        chooseComAdvertising = com;
        $iot.advertising.files.get(com).then(function (data) {
            $timeout(function () {
                $scope.communityData.AdFiles = data;
            });
        });
    };
    //添加时段form
    $scope.addPlayTimeForm = function () {
        $("#addplayTime").append('<form class="form-inline addplayform">\n' +
            '                            <div class="form-group form-group-sm">\n' +
            "                                <label>播放区间：</label>\n" +
            '                                <input type="time" name="StartTime" class="form-control">--\n' +
            '                                <input type="time" name="EndTime" class="form-control">\n' +
            "                            </div>\n" +
            '                            <div class="form-group form-group-sm">\n' +
            "                                <label>星期：</label>\n" +
            '                                <select class="form-control playWeek" multiple="multiple" name="WeekDays">\n' +
            '                                    <option value="0">星期日</option>\n' +
            '                                    <option value="1">星期一</option>\n' +
            '                                    <option value="2">星期二</option>\n' +
            '                                    <option value="3">星期三</option>\n' +
            '                                    <option value="4">星期四</option>\n' +
            '                                    <option value="5">星期五</option>\n' +
            '                                    <option value="6">星期六</option>\n' +
            "                                </select>\n" +
            "                            </div>\n" +
            '                            <div class="form-group form-group-sm">\n' +
            "                                <label>循环：</label>\n" +
            '                                <label class="radio-inline">\n' +
            '                                    <input type="radio" name="Loop" value="true" checked> 是\n' +
            "                                </label>\n" +
            '                                <label class="radio-inline">\n' +
            '                                    <input type="radio" name="Loop" value="false"> 否\n' +
            "                                </label>\n" +
            "                            </div>\n" +
            '                            <button type="button" class="btn btn-default btn-sm" onclick=\'removeSelf(event)\'>删除</button>\n' +
            "                        </form>");
        $(".playWeek").multiselect({
            buttonContainer: '<div class="btn-group btn-group-sm" />'
        });
    };
    //删除时段form
    function removeSelf(event) {
        var parent = document.getElementById("addplayTime");
        parent.removeChild(event.srcElement.parentElement);
    }
    //时间转换成秒数
    function timeToSeconds(time) {
        var timeStr = String(time);
        var hours = Number(timeStr.substring(0, 2));
        var minutes = Number(timeStr.substring(3));
        return hours * 3600 + minutes * 60;
    }
    //秒数转化成时间
    $scope.secondsTotime = function (secondStr) {
        var second = Number(secondStr);
        var hour = ("0" + ((second / 3600) | 0)).slice(-2);
        var minute = ("0" + (((second % 3600) / 60) | 0)).slice(-2);
        return hour + ":" + minute;
    };
    //星期过滤器
    $scope.weekDayToStr = function (weekDays) {
        if (weekDays.length === 0) {
            return "星期";
        }
        var list = [];
        var str;
        var week = Helper.weekConstans;
        for (var i = 0; i < weekDays.length; i++) {
            list.push(week[weekDays[i]]);
        }
        str = list.join("、");
        str = "星期" + str;
        return str;
    };
    //上传计划
    $scope.addPlaybackPlan = function () {
        var playbackPlanData = {
            fileId: "",
            remark: "",
            plans: []
        };
        var playbackPlan = $("#playbackPlanForm");
        var playbackPlanFormData = new FormData(playbackPlan[0]);
        if (!playbackPlanFormData.get("FileId")) {
            alert("请选择文件！");
            return;
        }
        if (!playbackPlanFormData.get("Remark")) {
            alert("请填写备注！");
            return;
        }
        if (!playbackPlanFormData.get("Term")) {
            alert("请填写终止时间！");
            return;
        }
        var playForms = $(".addplayform");
        if (playForms.length === 0) {
            alert("请添加时段");
            return;
        }
        for (var i = 0; i < playForms.length; i++) {
            var formData = new FormData(playForms[i]);
            if (!formData.get("StartTime")) {
                alert("有时段开始时间没有正确填写！");
                return;
            }
            if (!formData.get("EndTime")) {
                alert("有时段结束时间没有正确填写！");
                return;
            }
            if (timeToSeconds(formData.get("StartTime")) >= timeToSeconds(formData.get("EndTime"))) {
                alert("有时段结束时间没有大于开始时间！");
                return;
            }
            if (formData.getAll("WeekDays").length === 0) {
                alert("有时段的星期没有选择");
                return;
            }
            formData.set("StartTime", String(timeToSeconds(formData.get("StartTime"))));
            formData.set("EndTime", String(timeToSeconds(formData.get("EndTime"))));
            playbackPlanData.plans.push({
                startTime: Number(formData.get("StartTime")),
                endTime: Number(formData.get("EndTime")),
                weekDays: formData.getAll("WeekDays").map(Number),
                loop: !!formData.get("Loop")
            });
        }
        playbackPlanData.fileId = playbackPlanFormData.get("FileId");
        var termTimestamp = new Date(Number(playbackPlanFormData.get("Term"))).getTime() / 1000;
        var today = new Date().getTime() / 1000;
        if (termTimestamp <= today) {
            alert("终止时间需要大于今天！");
            return;
        }
        playbackPlanData.term = termTimestamp;
        playbackPlanData.remark = playbackPlanFormData.get("Remark");
        $iot.advertising.plans
            .post(chooseComAdvertising, playbackPlanData)
            .then(function () {
            alert("上传成功！");
            $iot.advertising.plans.get(chooseComAdvertising).then(function (data) {
                $timeout(function () {
                    console.log(data);
                    $scope.communityData.AdvertisingPlans = data;
                });
            });
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    //删除计划
    var selectedPlan;
    $scope.deletePlaybackPlan = function () {
        if (!selectedPlan) {
            return;
        }
        console.log(selectedPlan);
        $iot.advertising.plans
            .delete(selectedPlan)
            .then(function (x) {
            console.log(x);
            if (x.result) {
                $iot.advertising.plans.get(chooseComAdvertising).then(function (data) {
                    $timeout(function () {
                        console.log(data);
                        $scope.communityData.AdvertisingPlans = data;
                    });
                });
            }
            else {
                alert("删除失败！" + x.message);
            }
        })
            .catch(function (err) {
            console.log(err);
        });
    };
    //选择播放计划
    $scope.choosePlan = function (plan) {
        selectedPlan = plan.id;
        //获取计划的已投放设备
        $iot.advertising.devices.get(selectedPlan).then(function (data) {
            $timeout(function () {
                $scope.ChooseauthDevice_AD = $scope.communityData.ADunAuthDevice.filter(function (item) { return data.indexOf(item.id) === -1; });
                $scope.alreadyAuth_AD = $scope.communityData.ADunAuthDevice.filter(function (item) { return data.indexOf(item.id) !== -1; });
            });
        });
    };
    //选择播放计划样式
    $scope.choosePlanStyle = function (item) { return (item.id === selectedPlan ? "success" : ""); };
    //授权播放计划
    $scope.authAdPlayToDevice = function () {
        $scope.authADCompleteinfo = [];
        var selectDevice = angular.element("input:checkbox[name='chooseAuthDevice_AD']:checked");
        var selectDeviceList = mapToArray(selectDevice, function (x) { return angular.fromJson(x.value).id; });
        if (selectDeviceList.length === 0) {
            return;
        }
        for (var i = 0; i < selectDeviceList.length; i++) {
            (function (i) {
                var issue = {
                    deviceId: selectDeviceList[i],
                    planId: selectedPlan
                };
                $iot.advertising.issue
                    .post(issue)
                    .then(function (data) {
                    $timeout(function () {
                        if (data.result) {
                            var successDevice = $scope.communityData.ADunAuthDevice.$[selectDeviceList[i]];
                            $scope.alreadyAuth_AD.addOrUpdate(successDevice);
                            $scope.ChooseauthDevice_AD = $scope.ChooseauthDevice_AD.filter(function (item) { return item.id !== selectDeviceList[i]; });
                        }
                        data.device = selectDeviceList[i];
                        $scope.authADCompleteinfo.push(data);
                    });
                    console.log(data);
                })
                    .catch(function (err) {
                    console.log(err);
                });
            })(i);
        }
    };
    //取消授权播放计划
    $scope.deleteAuth_AD = function () {
        $scope.authADCompleteinfo = [];
        var selectDevice = angular.element("input:checkbox[name='chooseAlreadyAuth_AD']:checked");
        var selectDeviceList = mapToArray(selectDevice, function (x) { return angular.fromJson(x.value).id; });
        if (selectDeviceList.length === 0) {
            return;
        }
        for (var i = 0; i < selectDeviceList.length; i++) {
            (function (i) {
                var issue = {
                    deviceId: selectDeviceList[i],
                    planId: selectedPlan
                };
                $iot.advertising.issue
                    .post(issue)
                    .then(function (data) {
                    $timeout(function () {
                        if (data.result) {
                            var successDevice = $scope.communityData.ADunAuthDevice.$[selectDeviceList[i]];
                            $scope.ChooseauthDevice_AD.addOrUpdate(successDevice);
                            $scope.alreadyAuth_AD = $scope.alreadyAuth_AD.filter(function (item) { return item.id !== selectDeviceList[i]; });
                        }
                        data.device = selectDeviceList[i];
                        $scope.authADCompleteinfo.push(data);
                    });
                    console.log(data);
                })
                    .catch(function (err) {
                    console.log(err);
                });
            })(i);
        }
    };
    /*广告投放结束*/
    /*查询系统开始*/
    $scope.moreQuery = "更多选项";
    $scope.openMore = false;
    $scope.openMoreChange = function () {
        if ($scope.openMore) {
            $scope.openMore = false;
            $scope.moreQuery = "更多选项";
        }
        else {
            $scope.openMore = true;
            $scope.moreQuery = "关闭更多";
        }
    };
    //查询系统视图加载
    $scope.chooseQueryView = function (viewNumber) {
        switch (viewNumber) {
            case 1:
                sideUrlChooseQuery = 1;
                $scope.selectedView = 1;
                return;
            case 2:
                sideUrlChooseQuery = 2;
                $scope.selectedView = 2;
                return;
        }
    };
    $scope.functionalQueryView = function () {
        switch ($scope.selectedView) {
            case 1:
                return "views/QueryView/record.html?" + $iot.startTime;
            case 2:
                return "views/QueryView/DeviceStatus.html?" + $iot.startTime;
            default:
                sideUrlChooseQuery = 1;
                return "views/QueryView/record.html?" + $iot.startTime;
        }
    };
    //缓存查询字段
    $scope.searchData = {
        GateList: []
    };
    //静态事件列表
    $scope.eventlist = Helper.eventConstans;
    $scope.event = $scope.eventlist[0].id; //事件初始化
    //初始化搜索时间
    $scope.initTime = function () {
        $("#startTime").val(new Date().format("yyyy-MM-dd") + " 00:00:00");
        $("#endTime").val(new Date().format("yyyy-MM-dd") + " 23:59:59");
    };
    $scope.getGate = function (comid) {
        $iot.ranger.devices.get(comid).then(function (data) {
            $timeout(function () {
                var dataView = data.map(Helper.deviceToView);
                $scope.searchData.GateList = orderBy(dataView, "Name");
                $scope.searchData.GateList.unshift({
                    id: "",
                    address: "全部"
                });
                $scope.searchData.Gate = $scope.searchData.GateList[0].id;
            });
        });
        $iot.communities.loadArch(comid).then(function (data) {
            $timeout(function () {
                $scope.communityData.queryAddress = data;
            });
        });
    };
    //查询记录
    $rootScope.recordBarData = false;
    $rootScope.listQuery = false;
    $scope.QueryRecord = function (com, gate, event, name, nric, phone, addressBuilding, addressUnit, addressRoom) {
        if (!com || com.length === 0)
            return;
        if (nric) {
            var validator = new IDValidator();
            if (!validator.isValid(nric)) {
                alert("身份证号码格式不正确！");
                return;
            }
        }
        //查询的小区
        for (var i = 0; i < $scope.adminData.communities.length; i++) {
            if ($scope.adminData.communities[i].id === com) {
                $scope.comName = $scope.adminData.communities[i].name;
                break;
            }
        }
        //获取查询时间范围
        var startTimeStr = document.getElementById("startTime").value;
        var endTimeStr = document.getElementById("endTime").value;
        var beginTime = TimeConvert.getTimestamp(startTimeStr);
        var endTime = TimeConvert.getTimestamp(endTimeStr);
        var requestData = {
            beginTime: beginTime,
            endTime: endTime,
            gate: gate,
            community: com,
            event: event,
            nric: nric,
            name: name,
            phone: phone
        };
        if (addressBuilding) {
            requestData.address = addressBuilding.id;
        }
        if (addressUnit) {
            requestData.address = addressBuilding.id + addressUnit.id;
        }
        if (addressRoom) {
            requestData.address = addressBuilding.id + addressUnit.id + addressRoom.id;
        }
        console.log(JSON.parse(JSON.stringify(requestData)));
        $iot.ranger.events
            .query(requestData)
            .then(function () { })
            .catch(function (err) {
            console.log(err);
        });
    };
    $scope.detail = function (id, eventType) {
        $scope.Imgbase = "Ranger/EventImage/" + id + "/" + eventType;
        $("#detailImage").modal("show");
    };
    $scope.enlargeImg = function () {
        $("#detailModal").addClass("enlargeImg");
    };
    $scope.restoreImg = function () {
        $("#detailModal").removeClass("enlargeImg");
    };
    //设备日志查询
    //设备状态
    $scope.StatusIds = Helper.statusConstans;
    $scope.StatusId = undefined;
    $scope.QueryStatus = function (com, gate, statusid) {
        if (!com || com.length === 0)
            return;
        //查询的小区
        for (var i = 0; i < $scope.adminData.communities.length; i++) {
            if ($scope.adminData.communities[i].id === com) {
                $scope.comName = $scope.adminData.communities[i].name;
                break;
            }
        }
        //获取查询时间范围
        var startTimeStr = document.getElementById("startTime").value;
        var endTimeStr = document.getElementById("endTime").value;
        var beginTime = TimeConvert.getTimestamp(startTimeStr);
        var endTime = TimeConvert.getTimestamp(endTimeStr);
        var requestData = {
            beginTime: beginTime,
            endTime: endTime,
            deviceId: gate,
            communityId: com,
            status: statusid
        };
        console.log(requestData);
        $iot.ranger.logs
            .query(requestData)
            .then(function () { })
            .catch(function (err) {
            console.log(err);
        });
    };
});
//# sourceMappingURL=webAppMain.js.map