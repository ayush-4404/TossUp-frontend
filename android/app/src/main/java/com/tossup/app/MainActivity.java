package com.tossup.app;

import android.os.Bundle;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// Keep the WebView below system bars to avoid content overlapping the status bar.
		WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
	}
}
