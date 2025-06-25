// Device and browser information collection utility

export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {}; // Return empty object on server-side
  }

  const userAgent = navigator.userAgent;
  const deviceInfo = {
    userAgent: userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || navigator.userLanguage,
    referrer: document.referrer || null,
    deviceInfo: {
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      colorDepth: screen.colorDepth || null,
      pixelDepth: screen.pixelDepth || null,
      availableScreenSize: `${screen.availWidth}x${screen.availHeight}`,
    }
  };

  // Detect browser name and version
  const browserInfo = detectBrowser(userAgent);
  deviceInfo.browserName = browserInfo.name;
  deviceInfo.browserVersion = browserInfo.version;

  // Detect device type
  deviceInfo.deviceType = detectDeviceType(userAgent);

  // Detect operating system
  deviceInfo.operatingSystem = detectOperatingSystem(userAgent);

  return deviceInfo;
}

function detectBrowser(userAgent) {
  const browsers = [
    { name: 'Chrome', pattern: /Chrome\/([0-9.]+)/ },
    { name: 'Firefox', pattern: /Firefox\/([0-9.]+)/ },
    { name: 'Safari', pattern: /Version\/([0-9.]+).*Safari/ },
    { name: 'Edge', pattern: /Edg\/([0-9.]+)/ },
    { name: 'Opera', pattern: /Opera\/([0-9.]+)/ },
    { name: 'Internet Explorer', pattern: /MSIE ([0-9.]+)/ },
  ];

  for (const browser of browsers) {
    const match = userAgent.match(browser.pattern);
    if (match) {
      return {
        name: browser.name,
        version: match[1]
      };
    }
  }

  return {
    name: 'Unknown',
    version: 'Unknown'
  };
}

function detectDeviceType(userAgent) {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

function detectOperatingSystem(userAgent) {
  const systems = [
    { name: 'Windows 11', pattern: /Windows NT 10.0.*WOW64|Windows NT 10.0.*Win64/ },
    { name: 'Windows 10', pattern: /Windows NT 10.0/ },
    { name: 'Windows 8.1', pattern: /Windows NT 6.3/ },
    { name: 'Windows 8', pattern: /Windows NT 6.2/ },
    { name: 'Windows 7', pattern: /Windows NT 6.1/ },
    { name: 'Windows Vista', pattern: /Windows NT 6.0/ },
    { name: 'Windows XP', pattern: /Windows NT 5.1/ },
    { name: 'macOS', pattern: /Mac OS X|Macintosh/ },
    { name: 'iOS', pattern: /iPhone|iPad|iPod/ },
    { name: 'Android', pattern: /Android/ },
    { name: 'Linux', pattern: /Linux/ },
    { name: 'Chrome OS', pattern: /CrOS/ },
  ];

  for (const system of systems) {
    if (system.pattern.test(userAgent)) {
      return system.name;
    }
  }

  return 'Unknown';
}