# Taobao Clean Promo Links

将淘宝、天猫页面中可识别商品 ID 的推广跳转链接改写为干净商品链接的油猴脚本。

此仓库保存原始脚本 v1.0.0，未修改脚本逻辑或元数据。

## 安装

1. 在浏览器中安装 Tampermonkey（油猴）扩展。
2. 打开仓库中的 [`taobao-clean-promo-links.user.js`](./taobao-clean-promo-links.user.js)，复制完整内容。
3. 在 Tampermonkey 中选择“添加新脚本”，替换默认内容并保存。
4. 确认脚本已启用，然后刷新淘宝或天猫页面。

本脚本未配置 GitHub 自动更新地址。

## 工作方式

- 在淘宝和天猫的 HTTPS 页面及其子域名运行。
- 识别 `simba.taobao.com`（含子域名）、`s.click.taobao.com`、`g.click.taobao.com`、`i.click.taobao.com` 和 `click.taobao.com`。
- 从链接参数或解码后的链接文本中提取至少 6 位数字的商品 ID。
- 将可识别链接统一改写为 `https://item.taobao.com/item.htm?id=商品ID`。
- 扫描现有链接，监听动态新增节点、`href` 变化及点击相关事件。
- 将原始链接保存在对应元素的 `data-taobao-promo-original` 属性中。

## 调试

脚本在页面上提供 `window.TaobaoCleanPromo`：

```javascript
TaobaoCleanPromo.extract('https://s.click.taobao.com/example?itemId=123456789012');
TaobaoCleanPromo.clean('123456789012');
TaobaoCleanPromo.scan();
```
