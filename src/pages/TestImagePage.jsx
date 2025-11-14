import { useState } from 'react'

export function TestImagePage() {
  const [imageUrl, setImageUrl] = useState('https://res.cloudinary.com/dpexdafmq/image/upload/v1763118553/Quintus_nc5viz.jpg')
  const [imageError, setImageError] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageError = (e) => {
    console.error('图片加载失败:', e)
    setImageError('图片加载失败')
  }

  const handleImageLoad = () => {
    console.log('图片加载成功')
    setImageLoaded(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">图片加载测试</h1>

        {/* 输入框 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Cloudinary 图片URL:
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value)
              setImageError(null)
              setImageLoaded(false)
            }}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* 测试结果 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 方法1: 标准img标签 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">方法1: 标准 &lt;img&gt; 标签</h2>
            <img
              src={imageUrl}
              alt="测试图片"
              className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {imageError && (
              <div className="mt-2 p-3 bg-red-50 text-red-700 rounded">
                ❌ {imageError}
              </div>
            )}
            {imageLoaded && !imageError && (
              <div className="mt-2 p-3 bg-green-50 text-green-700 rounded">
                ✅ 图片加载成功
              </div>
            )}
          </div>

          {/* 方法2: 背景图 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">方法2: 背景图</h2>
            <div
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              className="w-full h-64 rounded-lg border-2 border-gray-200"
            />
          </div>
        </div>

        {/* 优化建议 */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">🔧 优化建议</h2>
          <div className="space-y-2 text-sm">
            <p><strong>原始URL:</strong></p>
            <code className="block bg-white p-2 rounded text-xs overflow-x-auto">
              {imageUrl}
            </code>
            
            <p className="mt-4"><strong>优化后的URL (自动格式 + 质量优化 + 宽度200px):</strong></p>
            <code className="block bg-white p-2 rounded text-xs overflow-x-auto">
              {imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_200/')}
            </code>
            
            <button
              onClick={() => setImageUrl(imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_200/'))}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              使用优化URL
            </button>
          </div>
        </div>

        {/* 检查清单 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">✅ 检查清单</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <input type="checkbox" className="mr-2" />
              图片URL可以在浏览器新标签页中直接打开
            </li>
            <li>
              <input type="checkbox" className="mr-2" />
              浏览器控制台没有CORS错误
            </li>
            <li>
              <input type="checkbox" className="mr-2" />
              Cloudinary账户的CORS设置正确
            </li>
            <li>
              <input type="checkbox" className="mr-2" />
              网络连接正常，可以访问其他图片
            </li>
            <li>
              <input type="checkbox" className="mr-2" />
              图片文件确实上传成功到Cloudinary
            </li>
          </ul>
        </div>

        {/* 直接在新标签页打开 */}
        <div className="mt-6">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            在新标签页中打开图片测试
          </a>
        </div>
      </div>
    </div>
  )
}
