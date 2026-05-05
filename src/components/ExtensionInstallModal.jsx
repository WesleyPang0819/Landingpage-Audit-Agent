import React from 'react';
import { X } from 'lucide-react';

const ExtensionInstallModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">安装 Chrome 扩展</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* 优势 */}
          <ul className="space-y-2">
            {['在任何网页一键启动审计', '无需打开网站，直接在浏览器使用', '完全离线运行，速度极快'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>

          {/* 安装步骤 */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2 text-sm">
              <span>🧩</span> Chrome 扩展安装步骤
            </h3>
            <ol className="space-y-3">
              {[
                { step: '下载扩展程序文件夹（联系我们获取）', sub: null },
                { step: '打开 Chrome，地址栏输入：', sub: 'chrome://extensions' },
                { step: '开启右上角「开发者模式」', sub: null },
                { step: '点击「加载已解压的扩展程序」', sub: null },
                { step: '选择下载的 extension 文件夹', sub: null },
                { step: '完成！点击工具栏图标即可使用', sub: null },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    {item.step}
                    {item.sub && (
                      <div className="mt-1 px-2 py-1 bg-slate-200 rounded-lg text-xs font-mono text-slate-700 inline-block">
                        {item.sub}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 提示 */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
            <span className="font-black">提示：</span> 扩展程序即将上架 Chrome 网上应用店，届时只需一键安装。
          </div>

        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all"
          >
            我知道了
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExtensionInstallModal;
