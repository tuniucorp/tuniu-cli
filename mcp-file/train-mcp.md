火车票
概述
途牛火车票 MCP 服务提供基于 MCP 协议的车次列表搜索、火车票车次详情查询和在线预订功能，支持集成到 AI 助手、智能客服等应用中。

服务地址: https://openapi.tuniu.cn/mcp/train

核心特性:

无状态设计，无需维护会话
基于 API Key 认证
智能缓存，提升响应速度
完整的预订流程（查询车次列表→车次详情→下单）
一、快速开始
1.1 获取认证凭证

访问 途牛开放平台 注册并创建应用，获取：

API Key: 应用密钥（用于 apiKey 请求头）
1.2 第一个 API 调用

搜索2026年3月20日南京到上海的火车票：


curl -X POST "https://openapi.tuniu.cn/mcp/train" \
  -H "Content-Type: application/json" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "searchLowestPriceTrain",
      "arguments": {
        "departureCityName": "南京",
        "arrivalCityName": "上海",
        "departureDate": "2026-03-20"
      }
    }
  }'
响应解析：


const response = await fetch(...);
const result = await response.json();

// ⚠️ 重要：result.content[0].text 是 JSON 字符串，需要再次解析
const data = JSON.parse(result.result.content[0].text);

console.log('火车票车次列表:', data.data);
二、常用 Client 配置
2.1 Cursor IDE

配置路径：

Cursor Settings → Tools & MCP → 新增
配置示例：


{
  "mcpServers": {
    "tuniu-flight": {
      "url": "https://openapi.tuniu.cn/mcp/train",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
使用方式：

在 Cursor Chat 中询问："查询2026年3月20日南京到上海的火车票"
AI 会调用 MCP 工具并返回结果
2.2 OpenClaw

打开命令行工具（Terminal / 命令提示符），选择以下任意一种方式安装。

方式一：npx 直接安装


npx clawhub@latest install tuniu-train
方式二：全局安装 clawhub


npm i -g clawhub
clawhub install tuniu-train
方式一、方式二如遇 Rate limit exceeded，请先执行 clawhub login --token 你的TOKEN 再重新安装。

方式三：SkillHub 国内镜像（下载更快更稳定）


# 安装 SkillHub CLI
curl -fsSL https://skillhub-1251783334.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash

# 安装技能
skillhub install tuniu-train
方式四：手动安装（备选）

如遇安装失败，可 下载 SKILL 文件 手动安装至 OpenClaw。

安装成功示例：


✔ OK. Installed tuniu-train -> /root/.openclaw/workspace/skills/tuniu-train
安装完成后，在聊天界面提供 apiKey 即可进行车次列表搜索和预订。

2.3 CoPaw

配置路径：

侧边栏：智能体 → MCP → 创建客户端
配置示例：


{
  "mcpServers": {
    "tuniu-train": {
      "url": "https://openapi.tuniu.cn/mcp/train",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
使用方式：

在 CoPaw 中询问："查询2026年3月20日南京到上海的火车票"
2.4 LobsterAI IDE

配置路径：

LobsterAI IDE 左侧目录MCP → 自定义 → 新增
配置示例：


服务名称：
  途牛火车票 MCP 服务
描述：
  途牛火车票 MCP 服务提供基于 MCP 协议的火车票查询和在线预订功能
传输类型：
  HTTP流式传输
URL：
  https://openapi.tuniu.cn/mcp/train
请求头：
  apiKey - YOUR_API_KEY
使用方式：

在 LobsterAI Chat 中询问："查询2026年3月20日南京到上海的火车票"
AI 会调用 MCP 工具并返回结果
三、Tools 列表
3.1 searchLowestPriceTrain（车次列表搜索）

功能: 根据出发站、到达站和出发日期搜索火车票车次，支持分页查询。

参数:

参数	类型	必需	说明
departureCityName	string	✅	出发城市名称
arrivalCityName	string	✅	到达城市名称
departureDate	string	✅	出发日期 YYYY-MM-DD
departureTime	string	❌	指定出发时间范围,如 '08:00-12:00'
arrivalTime	string	❌	指定到达时间范围,如 '18:00-20:00'
pageNum	number	❌	页码（分页时传递，从2开始）
queryId	string	❌	快照id（非首次查询时传递）
请求示例:


{
  "name": "searchLowestPriceTrain",
  "arguments": {
    "departureCityName": "南京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-20",
    "departureTime": "08:00-12:00",
    "arrivalTime": "18:00-20:00"
  }
}
响应字段:


{
    "successCode": true,
    "data": [
        {
            "trainNum": "1461",//车次号
            "departStationName": "蚌埠",//出发站名称
            "destStationName": "南京",//到达站名称
            "trainType": "direct",//直达
            "departureTime": "2025-03-17 00:51",//发车时间
            "arrivalTime": "2025-03-17 02:56",//到达时间
            "price": {
                "gjrwPrice": "",//高级软卧价格
                "rwPrice": "116.5",//软卧价格
                "rzPrice": "",//软座价格
                "swzPrice": "",//商务座价格
                "tdzPrice": "",//特等座价格
                "wzPrice": "25.5",//无座价格
                "ywPrice": "79.5",//硬卧价格
                "yzPrice": "25.5",//硬座价格
                "edzPrice": "",//二等座价格
                "ydzPrice": "",//一等座价格
                "dwPrice": "",//动卧价格
                "ydwPrice": "",//一等卧价格
                "edwPrice": ""//二等卧价格
            },
            "duration": "2时5分",//运行时长
            "seatAvailable": {
                "gjrwNum": null,//高级软卧余票
                "rwNum": 0,//软卧余票
                "rzNum": null,//软座余票
                "swzNum": null,//商务座余票
                "tdzNum": null,//特等座余票
                "wzNum": 0,//无座余票
                "ywNum": 0,//硬卧余票
                "yzNum": 3,//硬座余票
                "edzNum": null,//二等座余票
                "ydzNum": null,//一等座余票
                "dwNum": null,//动卧余票
                "ydwNum": null,//一等卧余票
                "edwNum": null//二等卧余票
            }
        }
    ],
    "queryId": "Qb0Jv5ZuBPTB",//快照id
    "totalPageNum": 4//总页数
}
分页示例:


{
  "name": "searchLowestPriceTrain",
  "arguments": {
    "queryId": "Qb0Jv5ZuBPTB",
    "pageNum": 2
  }
}
重要提示: 分页查询时只需传递queryId和 pageNum。

3.2 queryTrainDetail（火车票车次详情）

功能: 查询指定车次的详情和坐等价格详情，返回下单所需的关键字段。

前置条件: 需先调用 searchLowestPriceTrain 搜索车次列表。

参数:

参数	类型	必需	说明
departureStationName	string	✅	出发站名称（从搜索结果获取）
arrivalStationName	string	✅	到达站名称（从搜索结果获取）
departureDate	string	✅	出发日期 yyyy-MM-dd（从搜索结果获取）
trainNum	string	✅	车次号（从搜索结果获取）
请求示例:


{
  "name": "queryTrainDetail",
  "arguments": {
    "departureCityName": "南京南",
    "arrivalCityName": "上海虹桥",
    "departureDate": "2026-03-20",
    "flightNo": "G203"
  }
}
响应字段:


{
	"successCode": true,
	"data": {
		"isVoucherSaleForDetail": true,
		"isVoucherSaleForGrab": "0",
		"trainInfo": {
			"id": "161509",
			"trainId": "161509",//车次id
			"trainNum": "G1509",//车次号
			"trainType": 0,//车次类型;0:高铁;1:城际;2:动车;3:直达;4:特快;5:普快;6:其他
			"trainTypeCode": 0,//车次类型code
			"trainTypeName": "高铁",//车次类型名称
			"departCityId": "1602",//出发城市id
			"destCityId": "1619",//到达城市id
			"departStationName": "南京南",//出发站名称
			"departStationType": "始发",//出发站是否始发;0:始发；1:过路；2:终点
			"departStationTypeCode": 0,//出发站是否始发code;0:始发；1:过路；2:终点
			"destStationName": "无锡东",//到达站名称
			"destStationType": "过路",//到达站是否终点;0:始发；1:过路；2:终点
			"destStationTypeCode": 2,//到达站是否终点code;0:始发；1:过路；2:终点
			"departTime": "07:00",//出发时间
			"arriveTime": "07:57",//到达时间
			"saleStatus": "在售",//售卖状态
			"saleStatusId": 0,//售卖状态id
			"duration": "57分",//运行时长
			"departsDate": "2025-03-11",//出发日期
			"arriveDate": "2025-03-11",//到达日期
			"memoDay": "",
			"memoHour": "",
			"departureDates": {
				"yesterday": "2025-03-10",
				"today": "2025-03-11",
				"tomorrow": "2025-03-12"
			}
		},
		"seatInfo": [
			{
				"leftNumber": 99,//余位
				"seatId": 3,//坐等id;0：商务座;1：特等座;2：一等座;3：二等座;4：高级软卧;5：软卧;6：硬卧;7：软座;8：硬座;9：无座;10：动卧;19.一等卧;20.二等卧
				"seatName": "二等",//坐等名称
				"price": 86,//价格
				"adultPrice": 86,//成人价
				"promotionPrice": 86,//促销价
				"resId": 1980477395,//资源id
				"seatStatus": "有",
				"seatSequence": 0,
				"lowestPrice": null,
				"isConfigSeat": false,
				"configSeatInfo": null,
				"isSupportVoucherSection": true,
				"trainVoucherInfo": []
			},
			{
				"leftNumber": 2,
				"seatId": 2,
				"seatName": "一等",
				"price": 145,
				"adultPrice": 145,
				"promotionPrice": 145,
				"resId": 1980477394,
				"seatStatus": "",
				"seatSequence": 6,
				"lowestPrice": null,
				"isConfigSeat": false,
				"configSeatInfo": null,
				"isSupportVoucherSection": true,
				"trainVoucherInfo": []
			},
			{
				"leftNumber": 0,
				"seatId": 0,
				"seatName": "商务",
				"price": 271,
				"adultPrice": 271,
				"promotionPrice": 271,
				"resId": 1980477393,
				"seatStatus": "",
				"seatSequence": 8,
				"lowestPrice": null,
				"isConfigSeat": false,
				"configSeatInfo": null,
				"isSupportVoucherSection": false,
				"trainVoucherInfo": []
			}
		],
		"isOpen": 1,
		"needAdd": false,
		"departureDates": {
			"yesterday": "2025-03-10",
			"today": "2025-03-11",
			"tomorrow": "2025-03-12"
		},
		"couponsConfig": {//优惠券配置
			"displaySwitch": true,
			"recommendText": "用车特价券售卖"
		}
	}
}
重要提示: resId、departsDate、price 是下单时的必需参数。

3.3 bookTrain（预定下单）

功能: 预定下单火车票。

前置条件:

必须先调用 searchLowestPriceTrain 获取车次列表信息
必须调用 queryTrainDetail 获取 resId、departsDate、price
参数:

参数	类型	必需	说明
resources	list	✅	预定下单资源信息
adultTourists	list	✅	预定下单乘客信息
contact	object	✅	预定下单联系人信息
acceptStandingTicket	boolean	✅	是否接受无座
resources 格式:


[
  {
    "resourceId": 123456789,//坐等对应的资源id
    "departsDate": "2026-03-20",//出发日期
    "adultPrice": 123//坐等对应的价格
  }
]
adultTourists 格式:


[
  {
    "name": "途牛",//乘客姓名
    "psptType": "2026-03-20",//证件类型;1：身份证;2:护照
    "psptId": "110101199001014534"//证件号码
    "isStuDisabledArmyPolice": 0//乘客类型;0:成人
    "tel":"13056895266"//乘客手机号
  }
]
contact 格式:


{
  "tel": "13800138000"
}
请求示例:


{
  "name": "bookTrain",
  "arguments": {
    "acceptStandingTicket": false,
    "adultTourists": [
      {
        "isStuDisabledArmyPolice": 0,
        "name": "途牛",
        "psptId": "110101199001014534",
        "psptType": 1,
        "tel": "18888888888"
      }
    ],
    "contact": {
      "tel": "18888888888"
    },
    "resources": [
      {
        "adultPrice": 100.5,
        "departsDate": "2026-03-20",
        "resourceId": 355371385,
        "resourceType": 8
      }
    ]
  }
}
响应字段:


{
  successCode: boolean;
  orderId: string;           // 订单号
  orderDetailUrl: number;    // 订单详情url 
}
重要提示: 下单成功后 必须提醒用户点击 orderDetailUrl 完成支付。

四、完整预订流程
4.1 流程图


查询车次列表 → 查看具体车次坐等价格 → 选择坐等 → 创建订单 → 支付
4.2 代码示例


// 步骤1: 查询车次列表
const searchResult = await callTool('searchLowestPriceTrain', {
  departureCityName: '南京',
  arrivalCityName: '上海',
  departureDate: '2026-03-30',
});

const train = searchResult.data[0];

// 步骤2: 查询具体车次信息
const trainDetail = await callTool('queryTrainDetail', {
    departureStationName: '南京南',
    arrivalStationName: '上海虹桥',
    departureDate: '2026-03-20',
    trainNum: 'G203',
});

// 步骤3: 创建订单
const orderResult = await callTool('bookTrain', {
    "acceptStandingTicket": false,
    "adultTourists": [
        {
            "isStuDisabledArmyPolice": 0,
            "name": "途牛",
            "psptId": "110101199001014534",
            "psptType": 1,
            "tel": "18888888888"
        }
    ],
    "contact": {
        "tel": "18888888888"
    },
    "resources": [
        {
            "adultPrice": 100.5,
            "departsDate": "2026-03-20",
            "resourceId": 355371385,
            "resourceType": 8
        }
    ]
});

console.log('订单号:', orderResult.orderId);
console.log('订单详情支付链接:', orderResult.orderDetailUrl);
// 必须提醒用户点击 orderDetailUrl 完成支付