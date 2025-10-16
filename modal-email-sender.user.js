// ==UserScript==
// @name         AI Text Rewriter - Email Sender Patch
// @namespace    https://github.com/ai-tools/text-rewriter
// @version      2.3.1
// @description  Adds "Send as Email" button to AI modal for sharing original and rewritten text
// @author       AI Tools
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// @require      none
// ==/UserScript==

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        defaultRecipient: 'jl@3blaa.dk',
        emailSubject: 'AI-omskrevet tekst',
        buttonText: 'Send som mail',
        buttonClass: 'send-mail-btn',
        checkInterval: 500,
        maxAttempts: 60
    };
    
    // State tracking
    let attemptCount = 0;
    let observerActive = false;
    
    /**
     * Send email with original and rewritten text
     */
    function sendEmail(originalText, newText) {
        const body = `Original:\n${originalText}\n\nOmskrevet:\n${newText}`;
        const mailto = `mailto:${encodeURIComponent(CONFIG.defaultRecipient)}?subject=${encodeURIComponent(CONFIG.emailSubject)}&body=${encodeURIComponent(body)}`;
        
        console.log('📧 Opening email client with content');
        window.location.href = mailto;
    }
    
    /**
     * Find the AI modal in Shadow DOM
     */
    function findAIModal() {
        // Look for shadow host
        const shadowHost = document.querySelector('#ai-text-rewriter-host');
        if (!shadowHost || !shadowHost.shadowRoot) {
            return null;
        }
        
        // Look for visible panel
        const panel = shadowHost.shadowRoot.querySelector('.ai-panel[style*="display: block"], .ai-panel[style*="display:block"]');
        if (!panel) {
            return null;
        }
        
        // Verify it has the comparison textareas
        const originalField = panel.querySelector('#originalTextarea');
        const rewrittenField = panel.querySelector('#modifiedTextarea');
        
        if (!originalField || !rewrittenField) {
            return null;
        }
        
        return {
            panel: panel,
            originalField: originalField,
            rewrittenField: rewrittenField,
            shadowRoot: shadowHost.shadowRoot
        };
    }
    
    /**
     * Add "Send as Email" button to modal
     */
    function addEmailButton(modalInfo) {
        const { panel, originalField, rewrittenField, shadowRoot } = modalInfo;
        
        // Check if button already exists
        if (shadowRoot.querySelector(`.${CONFIG.buttonClass}`)) {
            console.log('📧 Email button already exists');
            return true;
        }
        
        // Find the button container
        const buttonContainer = panel.querySelector('.ai-buttons');
        if (!buttonContainer) {
            console.warn('⚠️ Button container not found');
            return false;
        }
        
        // Create the email button
        const btn = document.createElement('button');
        btn.textContent = CONFIG.buttonText;
        btn.className = `ai-button ${CONFIG.buttonClass}`;
        btn.style.cssText = 'background: #10b981; color: white; border-color: #10b981;';
        
        // Add hover effect
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#059669';
            btn.style.borderColor = '#059669';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#10b981';
            btn.style.borderColor = '#10b981';
        });
        
        // Add click handler
        btn.addEventListener('click', () => {
            const originalText = originalField.value || '';
            const newText = rewrittenField.value || '';
            
            if (!originalText && !newText) {
                alert('Ingen tekst at sende. Både original og omskrevet felt er tomme.');
                return;
            }
            
            sendEmail(originalText, newText);
        });
        
        // Insert button as first button in container
        buttonContainer.insertBefore(btn, buttonContainer.firstChild);
        
        console.log('✅ Email button added successfully');
        return true;
    }
    
    /**
     * Check for modal and add button if found
     */
    function checkAndAddButton() {
        attemptCount++;
        
        const modalInfo = findAIModal();
        
        if (modalInfo) {
            const success = addEmailButton(modalInfo);
            if (success) {
                console.log(`✅ Email button patch applied successfully (attempt ${attemptCount})`);
                return true;
            }
        }
        
        if (attemptCount < CONFIG.maxAttempts) {
            setTimeout(checkAndAddButton, CONFIG.checkInterval);
        } else {
            console.log('⏱️ Email button patch: Max attempts reached, waiting for next modal open');
        }
        
        return false;
    }
    
    /**
     * Setup MutationObserver to watch for modal appearance
     */
    function setupObserver() {
        if (observerActive) return;
        
        const observer = new MutationObserver((mutations) => {
            // Look for shadow host appearance or style changes
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const shadowHost = document.querySelector('#ai-text-rewriter-host');
                    if (shadowHost && shadowHost.shadowRoot) {
                        attemptCount = 0; // Reset attempt counter
                        checkAndAddButton();
                    }
                } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    if (target.id === 'ai-text-rewriter-host' || 
                        target.classList?.contains('ai-panel')) {
                        attemptCount = 0; // Reset attempt counter
                        checkAndAddButton();
                    }
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
        
        observerActive = true;
        console.log('👀 Email button patch observer started');
    }
    
    /**
     * Initialize the patch
     */
    function init() {
        console.log('📧 AI Text Rewriter - Email Sender Patch v2.3.1 loaded');
        
        // Initial check
        setTimeout(() => {
            checkAndAddButton();
        }, 1000);
        
        // Setup continuous monitoring
        setupObserver();
        
        // Also check periodically in case observer misses something
        setInterval(() => {
            const modalInfo = findAIModal();
            if (modalInfo) {
                const hasButton = modalInfo.shadowRoot.querySelector(`.${CONFIG.buttonClass}`);
                if (!hasButton) {
                    console.log('🔄 Email button missing, re-adding...');
                    addEmailButton(modalInfo);
                }
            }
        }, 5000);
    }
    
    // Start the patch when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('📧 Email Sender Patch: Script loaded and ready');
})();
