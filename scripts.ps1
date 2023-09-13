
[CmdletBinding()]
param(
	[ValidateSet('WatchTypedoc', 'CleanDist', 'CopyStyle', '')]
	[string]$JobType = 'WatchTypedoc'

)


switch ($JobType) {
	# 监控src目录,自动生成文档
	'WatchTypedoc' {
		# 5秒后打开html在浏览器，方便查看
		Start-Job -ScriptBlock {
			Start-Sleep -Seconds 5;	Start-Process ./typedoc/index.html
		}
		watchexec.exe -w src --restart --clear  --exts ts  pnpm typedoc:gen
		
	}
	'CleanDist' {
		Write-Debug 'Run CleanDist...'
		Remove-Item -Force -Recurse dist
	}
	'CopyStyle' {
		Copy-Item -Force -Recurse ./src/style ./dist/style
	}
	Default {
		Write-Host 'Please choose a Job Type'
	}
}



