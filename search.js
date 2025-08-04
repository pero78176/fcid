/**
 * FC2動画ID検索システム
 * GitHub Pages用の軽量検索ツール
 */

class FC2VideoSearcher {
    constructor() {
        this.videoIds = new Set();
        this.totalCount = 0;
        this.foundCount = 0;
        this.notFoundCount = 0;
        this.lastUpdated = '';
        
        this.initializeEventListeners();
        this.loadVideoData();
    }

    /**
     * イベントリスナーの初期化
     */
    initializeEventListeners() {
        const searchModeSelect = document.getElementById('search-mode');
        const searchBtn = document.getElementById('search-btn');
        const singleId = document.getElementById('single-id');
        const bulkIds = document.getElementById('bulk-ids');

        // 検索モード切り替え
        searchModeSelect.addEventListener('change', () => {
            this.toggleSearchMode();
        });

        // 検索ボタンクリック
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        // Enterキーでの検索実行
        singleId.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        bulkIds.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.performSearch();
            }
        });
    }

    /**
     * 検索モードの切り替え
     */
    toggleSearchMode() {
        const mode = document.getElementById('search-mode').value;
        const singleSearch = document.getElementById('single-search');
        const bulkSearch = document.getElementById('bulk-search');

        if (mode === 'single') {
            singleSearch.style.display = 'block';
            bulkSearch.style.display = 'none';
        } else {
            singleSearch.style.display = 'none';
            bulkSearch.style.display = 'block';
        }
    }

    /**
     * 外部APIから動画データを読み込み
     */
    async loadVideoData() {
        try {
            this.showLoading(true);
            
            const response = await fetch('id_list.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // データを Set に格納（高速検索のため）
            this.videoIds = new Set(data.ids);
            this.totalCount = data.total_count;
            this.lastUpdated = new Date(data.generated_at).toLocaleString('ja-JP');
            
            // 統計情報を更新
            this.updateStats();
            
            console.log(`✅ 動画データ読み込み完了: ${this.totalCount}件`);
            
        } catch (error) {
            console.error('❌ データ読み込みエラー:', error);
            this.showError('データの読み込みに失敗しました。ページを再読み込みしてください。');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 検索実行
     */
    performSearch() {
        const mode = document.getElementById('search-mode').value;
        let searchIds = [];

        if (mode === 'single') {
            const singleId = document.getElementById('single-id').value.trim();
            if (!singleId) {
                this.showError('IDを入力してください。');
                return;
            }
            searchIds = [parseInt(singleId)];
        } else {
            const bulkInput = document.getElementById('bulk-ids').value.trim();
            if (!bulkInput) {
                this.showError('IDを入力してください。');
                return;
            }
            
            // 改行区切りでIDを分割し、数値に変換
            searchIds = bulkInput
                .split('\\n')
                .map(id => id.trim())
                .filter(id => id !== '')
                .map(id => parseInt(id))
                .filter(id => !isNaN(id));
                
            if (searchIds.length === 0) {
                this.showError('有効なIDが見つかりません。');
                return;
            }
        }

        // 検索実行
        this.executeSearch(searchIds);
    }

    /**
     * 実際の検索処理
     */
    executeSearch(searchIds) {
        const results = [];
        let tempFoundCount = 0;
        let tempNotFoundCount = 0;

        searchIds.forEach(id => {
            const isFound = this.videoIds.has(id);
            results.push({
                id: id,
                found: isFound
            });

            if (isFound) {
                tempFoundCount++;
            } else {
                tempNotFoundCount++;
            }
        });

        // 統計を更新
        this.foundCount += tempFoundCount;
        this.notFoundCount += tempNotFoundCount;
        this.updateStats();

        // 結果を表示
        this.displayResults(results);
    }

    /**
     * 検索結果の表示
     */
    displayResults(results) {
        const container = document.getElementById('results-container');
        container.innerHTML = '';

        const resultCard = document.createElement('div');
        resultCard.className = 'card result-card fade-in';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.innerHTML = '<i class="fas fa-list-alt me-2"></i>検索結果';
        cardBody.appendChild(title);

        results.forEach(result => {
            const resultItem = this.createResultItem(result);
            cardBody.appendChild(resultItem);
        });

        resultCard.appendChild(cardBody);
        container.appendChild(resultCard);

        // スムーズスクロール
        container.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 個別結果アイテムの作成
     */
    createResultItem(result) {
        const item = document.createElement('div');
        item.className = `alert ${result.found ? 'alert-success' : 'alert-danger'} d-flex justify-content-between align-items-center mb-2`;
        
        const leftContent = document.createElement('div');
        leftContent.innerHTML = `
            <strong>ID: ${result.id}</strong>
            <span class="ms-2">
                ${result.found ? 
                    '<i class="fas fa-check-circle me-1"></i>所持しています' : 
                    '<i class="fas fa-times-circle me-1"></i>所持していません'
                }
            </span>
        `;

        item.appendChild(leftContent);

        // 未所持の場合は外部リンクを追加
        if (!result.found) {
            const linksContainer = this.createExternalLinks(result.id);
            item.appendChild(linksContainer);
        }

        return item;
    }

    /**
     * 外部サイトリンクの作成
     */
    createExternalLinks(videoId) {
        const container = document.createElement('div');
        container.className = 'external-links';

        // 外部サイト設定
        const externalSites = [
            { id: 'site-fc2ppvdb', name: 'FC2PPVDB', url: `https://fc2ppvdb.com/search?stype=title&keyword=${videoId}`, color: 'primary' },
            { id: 'site-javmix', name: 'JavMix', url: `https://javmix.tv/?s=${videoId}`, color: 'success' },
            { id: 'site-spankbang', name: 'SpankBang', url: `https://jp.spankbang.com/s/fc2%20ppv%20${videoId}/`, color: 'info' },
            { id: 'site-tktube', name: 'TKTube', url: `https://tktube.com/ja/search/${videoId}/`, color: 'secondary' },
            { id: 'site-7mmtv', name: '7MMTV', url: `https://7mmtv.sx/ja/searchall_search/all/${videoId}/1.html`, color: 'dark' },
            { id: 'site-tokyomotion', name: 'TokyoMotion', url: `https://www.tokyomotion.net/search?search_query=${videoId}&search_type=videos`, color: 'warning' },
            { id: 'site-supjav', name: 'SupJav', url: `https://supjav.com/ja/?s=${videoId}`, color: 'danger' }
        ];

        // 個別サイトボタンを作成
        externalSites.forEach(site => {
            const checkbox = document.getElementById(site.id);
            console.log(`Checking site: ${site.id}, checkbox found: ${!!checkbox}, checked: ${checkbox ? checkbox.checked : 'N/A'}`);
            if (checkbox && checkbox.checked) {
                const btn = document.createElement('a');
                btn.href = site.url;
                btn.target = '_blank';
                btn.className = `btn btn-sm btn-outline-${site.color} me-1 mb-1`;
                btn.innerHTML = `<i class="fas fa-external-link-alt me-1"></i>${site.name}`;
                container.appendChild(btn);
            }
        });

        // 一括外部サイトオープンボタン
        const openAllBtn = document.createElement('button');
        openAllBtn.className = 'btn btn-sm btn-warning mb-1';
        openAllBtn.innerHTML = '<i class="fas fa-rocket me-1"></i>一括検索';
        openAllBtn.onclick = () => this.openAllExternalSites(videoId);
        container.appendChild(openAllBtn);

        return container;
    }

    /**
     * 全ての外部サイトを一括で開く
     */
    openAllExternalSites(videoId) {
        const externalSites = [
            { id: 'site-fc2ppvdb', url: `https://fc2ppvdb.com/search?stype=title&keyword=${videoId}` },
            { id: 'site-javmix', url: `https://javmix.tv/?s=${videoId}` },
            { id: 'site-spankbang', url: `https://jp.spankbang.com/s/fc2%20ppv%20${videoId}/` },
            { id: 'site-tktube', url: `https://tktube.com/ja/search/${videoId}/` },
            { id: 'site-7mmtv', url: `https://7mmtv.sx/ja/searchall_search/all/${videoId}/1.html` },
            { id: 'site-tokyomotion', url: `https://www.tokyomotion.net/search?search_query=${videoId}&search_type=videos` },
            { id: 'site-supjav', url: `https://supjav.com/ja/?s=${videoId}` }
        ];

        const selectedSites = [];
        externalSites.forEach(site => {
            const checkbox = document.getElementById(site.id);
            if (checkbox && checkbox.checked) {
                selectedSites.push(site.url);
            }
        });

        if (selectedSites.length === 0) {
            this.showError('外部サイトが選択されていません。');
            return;
        }

        // 確認ダイアログ
        if (confirm(`${selectedSites.length}個のサイトを新しいタブで開きますか？`)) {
            selectedSites.forEach(url => {
                window.open(url, '_blank');
            });
        }
    }

    /**
     * 統計情報の更新
     */
    updateStats() {
        document.getElementById('total-count').textContent = this.totalCount.toLocaleString();
        document.getElementById('found-count').textContent = this.foundCount.toLocaleString();
        document.getElementById('not-found-count').textContent = this.notFoundCount.toLocaleString();
        document.getElementById('last-updated').textContent = this.lastUpdated;
    }

    /**
     * ローディング表示の制御
     */
    showLoading(show) {
        const loading = document.querySelector('.loading');
        const searchBtn = document.getElementById('search-btn');
        
        if (show) {
            loading.style.display = 'block';
            searchBtn.disabled = true;
        } else {
            loading.style.display = 'none';
            searchBtn.disabled = false;
        }
    }

    /**
     * エラーメッセージの表示
     */
    showError(message) {
        const container = document.getElementById('results-container');
        container.innerHTML = `
            <div class="alert alert-danger fade-in" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>エラー:</strong> ${message}
            </div>
        `;
    }
}

// ページ読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    new FC2VideoSearcher();
    console.log('🚀 FC2動画ID検索システム初期化完了');
});