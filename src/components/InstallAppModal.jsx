import React from 'react';
import { X } from 'lucide-react';

const InstallAppModal = ({ isOpen, onClose, deferredPrompt, onInstallClick }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">安装到手机桌面</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* 安装优势 */}
          <ul className="space-y-2">
            {['从手机桌面快速进入', '全屏使用体验', '像真正的手机 App 一样使用'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>

          {/* iPhone 步骤 */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2 text-sm">
              <span>📱</span> iPhone 安装步骤（Safari）
            </h3>
            <ol className="space-y-2">
              {[
                '使用 Safari 打开本网站',
                '点击底部「分享」按钮',
                '向下滑动并点击「加入主屏幕」',
                '点击右上角「加入」',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Android 步骤 */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2 text-sm">
              <span>🤖</span> Android 安装步骤（Chrome）
            </h3>
            <ol className="space-y-2">
              {[
                '使用 Chrome 打开本网站',
                '点击右上角菜单（三个点）',
                '点击「安装 App」或「添加到主屏幕」',
                '确认安装',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-6 space-y-3">
          {deferredPrompt && (
            <button
              onClick={onInstallClick}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-blue-600/20"
            >
              立即安装
            </button>
          )}
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

export default InstallAppModal;
